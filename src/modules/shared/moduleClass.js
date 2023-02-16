const fs = require('fs')
const path = require('path')
const Logger = require('../../logging/shared/loggerClass')

module.exports = class Module {
    /** @type {string} The module name */
    name
    /** @type {string} The module's root directory */
    dir
    /** @type {import('../../logging/shared/loggerClass')} The module's logger */
    logger
    /** @type {any} Contents of the module's meta.json file or null if no such file exists */
    meta = null
    /** @type {any} Exported object(s) of the module */
    exports = null
    /** @type {?boolean} If the module was successfully loaded. Note: Null means that there is no explicit result yet, not that loading has failed! */
    loadSuccess = null

    /**
     * @param {string} modulePath The path to the mudule's root directory, either relative to project root or absolute 
     */
    constructor(modulePath) {
        this.dir = path.resolve(process.env.projectDir, modulePath)
        this.name = path.basename(this.dir)
        this.logger = process.logger(this.name)
        
        const metaPath = path.join(this.dir, 'meta.json')
        this.meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath).toString()) : null
    }

    /**
     * Private function which tests if a directory or file exists.
     * @param {string} dir the directory (or file)
     * @returns {?string} the directory (or file) if it exists, otherwise null
     */
    #getDirOrNull(dir) {
        return fs.existsSync(dir) ? dir : null
    }

    /**
     * @returns {?string} the module's public directory if it exists, otherwise null
     */
    public() {
        return this.#getDirOrNull(path.join(this.dir, 'public'))
    }

    /**
     * @returns {?string} the module's views directory if it exists, otherwise null
     */
    views() {
        return this.#getDirOrNull(path.join(this.dir, 'views'))
    }

    /**
     * @returns {?string} the module's routes directory if it exists, otherwise null
     */
    routes() {
        return this.#getDirOrNull(path.join(this.dir, 'routes'))
    }

    /**
     * @returns {?string} the module's module.js file if it exists, otherwise null
     */
    modulejs() {
        return this.#getDirOrNull(path.join(this.dir, 'module.js'))
    }

}