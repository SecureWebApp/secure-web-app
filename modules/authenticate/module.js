const fs = require('fs')
const path = require('path')

const express = require('express')
const { Session } = require('express-session')

const logger = process.logger('authenticate')


/**
 * This module provides basic access control for resources offered by the express application.
 * 
 * Every resource contained within public directories is always accessible, 
 * but every other request (even if the requested resource does not exist) is blocked unless the client is authenticated.
 * Resources which should always be accessible (like a login page) can be whitelisted by adding a corresponding
 * entry into the whitelist array contained within the exported `options` object.
 */


/**
 * @typedef {Object} AuthenticateOptions
 * @property {(string | RegExp)[]} whitelist Which urls or url-patterns should always be accessible.
 * @property {{(session: Session) => boolean}[]} authRevokationListeners A listener that can be used to revoke authentication on sessions.
 *                                                                  If true is returned the authenticated session is removed.
 * @property {?express.RequestHandler} onAuthenticationFailure The request handler executed if authentication fails.
 * @property {string} onFailureRedirectTarget If the default onAuthenticationFailure listener is used: 
 *                                                                Where the client should be redirected to if not authenticated.
 */
/** @type {AuthenticateOptions} */
let options = {
    whitelist: [],
    authRevokationListeners: [],
    onAuthenticationFailure: null,
    onFailureRedirectTarget: '/'
}

/** @type {string[]} List of files marked as public */
let public = []


/**
 * Utility function which checks if a whitelist entry matches the given url
 * @param {string | RegExp} value The whitelist entry 
 * @param {string} url The correct request url 
 * @returns {boolean} True if the value matches the url, false otherwise
 */
function testIfWhitelistMatch(value, url) {
    if (value instanceof RegExp)
        return value.test(url)
    else if (typeof value === 'string')
        return value === url
    return false
}

/** @type {express.RequestHandler} The default authentication failure request handler */
function onAuthenticationFailure(req, res) {
    logger.verbose(`Access violation at ${req.correctUrl}, redirecting to: ${options.onFailureRedirectTarget}`)
    res.redirect(options.onFailureRedirectTarget)
}

/** @type {(req: express.Request) => Promise<boolean>} This function tests if access can be granted based on session authentication */
async function testSessionAuthentication(req) {
    if (!req.session?.auth)
        return false
    if (options.authRevokationListeners.reduce((prev, v) => v(req.session) || prev, false)) {
        logger.debug(`Authentication on session '${req.sessionID}' revoked. Destroying session...`)
        return new Promise((res, rej) => req.session.destroy(e => e ? rej(e) : res(false)))
    }
    logger.debug(`Validated request with url '${req.correctUrl}': Session is authenticated.`)
    return true
}

/** @type {(url: string) => boolean} This function tests if access can be granted based on public and whiltelist */
function testPubliclyAvailable(url) {
    if (public.some(v => url === v)) {
        logger.debug(`Validated request with url '${url}': Resource is marked as public.`)
        return true
    } else if (options.whitelist.some(v => testIfWhitelistMatch(v, url))) {
        logger.debug(`Validated request with url '${url}': Resource is whitelisted.`)
        return true
    }
    return false
}

/** @type {express.RequestHandler} The authentication middleware */
async function auth(req, res, next) {
    if (await testSessionAuthentication(req))
        next()
    else if (testPubliclyAvailable(req.correctUrl))
        next()
    else {
        if (options.onAuthenticationFailure)
            options.onAuthenticationFailure(req, res, next)
        else
            onAuthenticationFailure(req, res, next)
    }    
}


/**
 * Recursive function which collects all files within a directory, 
 * while also resolving their relative path on the server.
 * @param {string} abspath the absolute path to the directory or subdirectory thereof
 * @param {string} relpath the relative path on the server
 * @returns {string[]} the collected files as relative paths
 */
 function collectFiles(abspath, relpath) {
    let collected = []
    fs.readdirSync(abspath, { withFileTypes: true }).forEach(v => {
        // resolve paths for file
        const fileAbsPath = path.join(abspath, v.name)
        const fileRelPath = path.join(relpath, v.name)
        // if directory: Call collectFiles again on this directory, add results to return array
        if (v.isDirectory())
            collected.push(...collectFiles(fileAbsPath, fileRelPath))
        // if file is a file add to array
        else if (v.isFile())
            collected.push('/' + fileRelPath)
    })
    return collected
}

function staticOverwrite(app, oldStatic) {
    logger.verbose(`Overwriting express.static`)
    return (root, options) => {
        // add all public files to a specific array
        const files = collectFiles(root, '.')
        public.push(...files)
        logger.debug(`Public expanded, new entries: [${files.join(', ')}]`)
        // pass-through to old static function 
        return oldStatic.call(app, root, options)
    }
}

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = app => {
    // overwrite app.static so that all public files can be recorded
    app.static = staticOverwrite(app, app.static)

    const _wlPush = options.whitelist.push
    options.whitelist.push = (...items) => {
        if (items?.length)
            logger.debug(`Whitelist expanded, new entries: [${items.join(', ')}]`)
        _wlPush.call(options.whitelist, ...items)
    }

    // apply authentication middleware
    logger.info('Installing authentication middleware')
    app.use(auth)

    return { options }
}
