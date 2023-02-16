/// Imports

// vanilla
const fs = require('fs')
const path = require('path')

// modules
const Module = require('./shared/moduleClass')
const moduleCache = require('./modules')


/// Private (internal) definitions

/** @type {import('../logging/shared/loggerClass')} */
const logger = process.logger('Loader')

/** @type {?import('express').Application} the express application */
let app = null

/**
 * Register a module's public directory with the express application
 * @param {Module} module the module
 */
function registerPublic(module) {
    const public = module.public()
    if (!public)
        return false
    app.use(app.static(public))
    return true
}

/**
 * Register a module's views directory with the express application
 * @param {Module} module the module
 * @returns {boolean} true if the module contains a 'views' directory
 */
function registerViews(module) {
    const viewsPath = module.views()
    if (!viewsPath)
        return false
    let views = app.get('views')
    if (Array.isArray(views)) 
        views.push(viewsPath)
    else if (typeof views === 'string') 
        views = [views, viewsPath]
    else 
        views = [viewsPath]
    app.set('views', views)
    return true
}


/**
 * Recursive function which collects all routes within a module's routes directory, 
 * while also resolving their relative path on the server.
 * @param {string} abspath the absolute path to the routes directory or subdirectory thereof
 * @param {string} relpath the relative path of the route on the server
 * @returns {{filepath: string, relpath: string}[]} the collected routes
 */
function collectRoutes(abspath, relpath) {
    let collected = []
    fs.readdirSync(abspath, { withFileTypes: true }).forEach(v => {
        // resolve paths for file
        const fileAbsPath = path.join(abspath, v.name)
        const fileRelPath = path.join(relpath, v.name)
        // if directory: Call collectRoutes again on this directory, add results to return array
        if (v.isDirectory())
            collected.push(...collectRoutes(fileAbsPath, fileRelPath))
        // if file is a file and extension equals .js: Assume script file is a route file and add to array
        else if (v.isFile() && path.extname(v.name) === '.js')
            collected.push({ filepath: fileAbsPath, relpath: fileRelPath })
    })
    return collected
}

/**
 * Register the module's routes with the express application.
 * A route file is registered by resolving it's relative path within the module's routes directory 
 * to the absolute server path ([module]/routes/dir/abc.js becomes [http://server.com]/dir/abc)
 * @param {Module} module the module
 * @returns {boolean} true if the module provides at least a single route
 */
function registerRoutes(module) {
    const routesPath = module.routes()
    if (!routesPath)
        return false
    const routes = collectRoutes(routesPath, '.')
    if (!routes.length)
        return false
    // register routes with express
    routes.forEach(v => {
        // remove tailing .js
        let encodedRelpath = v.relpath.slice(0, -3)
        // encode all path components so that they can be used inside a url
        encodedRelpath = encodedRelpath.split('/').map(encodeURIComponent).join('/')
        // if route is called index, assume base (/) path
        if (encodedRelpath === 'index')
            app.use('/', require(v.filepath))
        else
            app.use('/' + encodedRelpath, require(v.filepath))
    })
    return true
}

/**
 * Load a module's module.js.
 * 
 * Requirements for module.js:
 * module.js needs to export a function, this function receives the express application, the current module cache and it's own module object as arguments.
 * The return value of this funtion is stored into the module's {@link Module.exports} property,
 * this allows later loaded modules to interact with the exporting one.
 * This function can be asynchronous (either marked as async or returning a {@link Promise}).
 * 
 * @param {Module} mod the module
 * @returns {Promise<boolean>} true if the module has a module.js file, this file exports a function and completes without throwing an error 
 */
async function includeModule(mod) {
    const modulejsPath = mod.modulejs()
    if (!modulejsPath)
        return false
    const moduleFn = require(modulejsPath)
    if (typeof moduleFn !== 'function')
        return false

    try {
        mod.exports = await moduleFn(app, moduleCache, mod.logger, mod)
        return true
    } catch (error) {
        logger.error(`Failed to load module.js of ${mod.name}!`)
        logger.error(error)
        return false
    }
}


/// Public (exposed) definitions

/**
 * Entry point into the module loading system.
 * This function loads all modules included in modules_enabled.json.
 * 
 * Loading order policies:
 *  - Only modules that have an entry in the includes array in modules_enabled.json are loaded.
 *  - Modules are loaded in the sequence as they appear in modules_enabled.json
 *  - module.js can only access exports from modules loaded previously (self-explanatory)
 *  - Newer (later loaded) public files overwrite older (earlier loaded) public files
 *  - Newer (later loaded) views overwrite older (earlier loaded) views
 *  - Newer (later loaded) routes overwrite older (earlier loaded) routes
 * 
 * Structure:
 *  - Public files are placed in [ModuleRoot]/public
 *  - Views are placed in [ModuleRoot]/views and can be accessed using response.render
 *  - Routes are placed in [ModuleRoot]/routes, are js files and export an express router per default
 *  - module.js is placed at [ModuleRoot]/module.js and needs to fulfill the conditions mentioned here {@link includeModule}
 * 
 * @param {import("express").Application} app The express application
 */
async function load(expressApp) {
    // save express application in global variable
    app = expressApp

    const modulePath = process.join('modules')
    // test if modules directory does exist
    if (!fs.existsSync(modulePath))
        throw new Error('Modules directory is missing!')
    
    // object which keeps track of all modules that could be loaded
    let modulesAvaliable = {}
    // read modules directory, add each subdirectory to modulesAvailable
    fs.readdirSync(modulePath, { withFileTypes: true }).forEach(v => {
        if (v.isDirectory())
            modulesAvaliable[v.name] = path.join(modulePath, v.name)
    })
    
    const modulesEnabledPath = path.join(modulePath, 'modules_enabled.json')
    // test if modules_enabled.json does exist
    if (!fs.existsSync(modulesEnabledPath))
        throw new Error('modules_enabled.json does not exist in modules directory!')
    // load modules_enabled.json
    const modulesEnabled = JSON.parse(fs.readFileSync(modulesEnabledPath).toString())
    // test if includes attribute exist
    if (!Array.isArray(modulesEnabled.include))
        throw new Error('include attribute in modules_enabled.json is not an array!')

    // Note: To load modules correctly according to loading order policies explained above 
    // two passes are necessary. This is due to express's loading order being inverse to the one mentioned above.

    logger.verbose('Loading modules...')
    logger.debug('\n----------------------------------------------------------------')
    logger.debug('Running first pass: Loading module.js of all selected modules...')
    logger.debug('----------------------------------------------------------------\n')


    // First pass: Select modules that should be loaded, load each module's module.js in the process
    let modulesSelected = []
    for (const mod of modulesEnabled.include) {
        // Warn if an invalid module name is present in modulesEnabled.include
        if (!modulesAvaliable[mod])
            logger.warn(`Module '${mod}' in modules_enabled.json does not exist!`)
        // Warn if a duplicate entry is present in modulesEnabled.include
        else if (modulesSelected.some(v => v.name === mod))
            logger.warn(`Duplicate entry for module '${mod}' in modules_enabled.json!`)
        else {
            logger.verbose(`Preparing module '${mod}'...`)

            // Construct module object, add to module cache and modules selected
            const module = new Module(modulesAvaliable[mod])
            moduleCache.set(module.name, module)
            modulesSelected.push(module)

            // Load module's module.js
            if (await includeModule(module)) {
                logger.debug(`Loaded module.js of '${module.name}'.`)
                // Mark load success in module object
                module.loadSuccess = true
            }
        }
    }

    logger.debug('\n----------------------------------------------------------------------------------')
    logger.debug(`Running second pass: Loading resources of all selected modules in reverse order...`)
    logger.debug('----------------------------------------------------------------------------------\n')

    // Second pass: Load module resources (public, views and routes) backwards to account for express loading order.
    let successCtr = 0
    for (let i = modulesSelected.length - 1; i >= 0; i--) {
        const module = modulesSelected[i]
        // Register modules public dir
        if (registerPublic(module)) {
            logger.debug(`Included public dir of '${module.name}'.`)
            module.loadSuccess = true
        }
        // Register modules views
        if (registerViews(module)) {
            logger.debug(`Included views dir of '${module.name}'.`)
            module.loadSuccess = true
        }
        // Register modules routes
        if (registerRoutes(module)) {
            logger.debug(`Included routes dir of '${module.name}'.`)
            module.loadSuccess = true
        }

        // Report if module was successfully imported
        if (module.loadSuccess) {
            successCtr++
            logger.verbose(`Done loading module '${module.name}'.`)
        } else {
            // Mark loadSuccess as explicitly false
            module.loadSuccess = false
            logger.warn(`Module '${module.name}' could not be loaded: Attempted to load module, but nothing could be loaded!`)
        }
    }

    logger.info(`Done loading modules: [${modulesSelected.length}/${Object.values(modulesAvaliable).length}] selected, [${successCtr}/${modulesSelected.length}] sucessfully loaded.`)
}

module.exports = load
