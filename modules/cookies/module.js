const cookieParser = require('cookie-parser')

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    const secret = cache.require('shared_secrets').secret('cookie', 128)
    logger.info('Installing cookie parser middleware')
    app.use(cookieParser(secret))
}
