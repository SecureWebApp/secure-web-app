/// Imports

const { Router } = require('express')

const moduleCache = require(process.modules)
const cache = require('../../cache')
const { getUserSecret } = require('../../util/db')
const { verify } = require('../../util/secret')

const csrfExports = moduleCache.require('csrf')

/** @type {import('../../../csrf/types').validate} */
const csrf = csrfExports.csrf
/** @type {import('../../../csrf/types').validate} */
const validate = csrfExports.validate

const logger = process.logger('2fa')


/// Routing

const router = Router()

router.post('/', async (req, res) => {
    const callback = cache.loginCache.get(req.sessionID)
    if (!callback) {
        res.status(500).send('Something has gone wrong, please try again!')
        return logger.error(`Failed to find login callback for ${req.sessionID}!`)
    }
    cache.registerCache.delete(req.sessionID)

    let e
    if (e = validate(req, res))
        return callback(req, res, 'Invalid CSRF token')

    const body = req.unsafeBody || req.body
    const secret = await getUserSecret(req.session.accountId)
    const token = `${body.t1}${body.t2}${body.t3}${body.t4}${body.t5}${body.t6}`

    if (verify(secret, token)) {
        logger.debug(`Verification valid for session ${req.sessionID}`)
        callback(req, res)
    } else {
        logger.verbose(`Failed 2FA verification for session ${req.sessionID}: Invalid token`)
        // retry
        // place callback back in cache, while inefficient this approach ensures that this callback is only retrieved again in this specific case
        cache.registerCache.set(req.sessionID, callback)
        csrf(req, res)
        res.render('validateToken', { wrongToken: true })
    }
})

module.exports = router
