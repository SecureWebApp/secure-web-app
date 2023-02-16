const session = require('express-session')

/**
 * This tiny module builds the session module, 
 * thereby completing the session middleware setup. 
 * After this module is loaded changing any values in session.options 
 * will have no effect on the session middlewhere.
 */

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    let s = cache.require('session')
    s.options.secret = cache.require('shared_secrets').secret('cookie', 128)

    logger.info('Installing express session middleware')
    app.use(session(s.options))

    logger.info('Installing locals injection middleware')
    app.use((req, res, next) => {
        if (req.session?.locals) {
            res.locals = { ...res.locals, ...req.session.locals }
            delete req.session.locals
        }
        next()
    })
}
