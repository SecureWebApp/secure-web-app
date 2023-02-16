const logger = process.logger('relog')


/**
 * @param {import("express").Request} req 
 */
function logRequest(req) {
    logger.debug(`>> ${req.method} ${req.correctUrl}`)
    return Date.now()
}

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
function logResponse(req, res, reqTime) {
    if (!res.statusCode || res.statusCode < 400)
        logger.debug(`<< ${res.statusCode} ${req.correctUrl} ${(Date.now() - reqTime)}ms`)
    else
        logger.verbose(`<< ${`${res.statusCode}`.bold} ${req.correctUrl} ${(Date.now() - reqTime)}ms`)
}


/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
function mw(req, res, next) {
    const reqTime = logRequest(req, res)
    res.on('finish', () => logResponse(req, res, reqTime))
    next()
}

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = app => {
    logger.info(`Installing request & response logger middleware`)
    app.use(mw)
}
