const { Router } = require('express')
const router = Router()

const logger = process.logger('login')

router.get('/', (req, res) => {
    if (req.session?.auth) {
        logger.debug(`Destroying session ${req.sessionID}...`)
        req.session.destroy(() => res.redirect('/'))
    } else
        res.send('Not logged in!')
})

module.exports = router
