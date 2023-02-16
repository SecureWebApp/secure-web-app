const { Router } = require('express')
const router = Router()

const logger = process.logger('csp')

router.post('/', (req, res) => {
    logger.info('CSP violation detected!')

    const report = req.body['csp-report']
    if (report)
        logger.verbose(`Blocked "${report['blocked-uri']}", caused by directive "${report['violated-directive']}"`)
        
    res.sendStatus(204)
})

module.exports = router
