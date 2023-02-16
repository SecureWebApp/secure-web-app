const express = require('express')
const router = express.Router()

const logger = process.logger('error404')

/**
 * For all requests made to the application:
 * If no handler accepts the request then this handler is called which renders the 404 error page.
 */
router.all('*', (req, res) => {
    logger.verbose(`Failed to handle request "${req.correctUrl}". The requested route does not exist.`)
    if (req.method === 'GET')
        res.status(404).render('error404')
    else
        res.sendStatus(404)
})

module.exports = router
