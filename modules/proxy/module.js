/**
 * This module prepares the express application to accept a reverse-proxy between the application
 * and the client. If the session module is loaded the session.options object is also changed accordingly. 
 */

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    logger.info('Enabling proxy support.')
    app.set('trust proxy', 1)
    
    let { options } = cache.require('session', true)
    if (options)
        options.proxy = true
}
