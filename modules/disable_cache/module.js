/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    logger.info('Installing disable cache middleware')
    app.use((req, res, next) => {
        res.setHeader('Surrogate-Control', 'no-store')
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
        next()
    })
}
