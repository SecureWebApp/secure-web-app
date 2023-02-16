/// Imports

const { promisify } = require('util')
const { Router } = require('express')

const moduleCache = require(process.modules)
const { validatePassword } = require('../util/db')

const login = moduleCache.require('login')
const csrfExports = moduleCache.require('csrf')

/** @type {import('../module').LoginHook[]} */
const loginHooks = login.loginHooks
/** @type {import('../../csrf/types').csrf} */
const csrf = csrfExports.csrf
/** @type {import('../../csrf/types').validate} */
const validate = csrfExports.validate



/// Definitions

const logger = process.logger('login')

const router = Router()

/** @type {import('express').RequestHandler} */
function onLoginSuccess(req, res) {
    logger.debug(`Login successful for user ${req.session.userId}`)
    req.session.auth = true
    req.session.save(() => res.redirect('/'))
}

function evaluateHooks(_req, _res, hooks) {
    logger.debug('Evaluating login hooks')
    const callback = (req, res, error) => {
        if (error)
            res.send(error)
        else if (hooks.length) {
            logger.debug(`Hook completed, ${hooks.length - 1} remaining`)
            hooks.shift()(req, res, callback)
        } else
            onLoginSuccess(req, res)
    }
    hooks.shift()(_req, _res, callback)
}


/// Routing

router.get('/', async (req, res) => {
    if (req.session?.auth)
        res.redirect('/')
    else {
        if (!req.session)
            await promisify(req.session.regenerate).call(req.session)
        csrf(req, res)      // Setup csrf protection
        res.render('login')
    }
})

router.post('/', async (req, res) => {
    let e
    if (e = validate(req, res)) {
        csrf(req, res)
        return res.render('login', { csrfError: e })
    }

    const body = req.unsafeBody || req.body
    const user = await validatePassword(body.email, body.password)
    if (user) {
        if (!req.session)
            await promisify(req.session.regenerate).call(req.session)
        req.session.userId = user.userId
        req.session.accountId = user.accountId
        req.session.profileId = user.profileId

        // evaluate login hooks
        if (loginHooks.length)
            evaluateHooks(req, res, loginHooks.slice())
        else {
            console.log('Successfull login');
            onLoginSuccess(req, res)
        }
    } else {
        logger.verbose(`Failed login attempt for session ${req.sessionID}`)
        csrf(req, res)
        res.render('login', { wrongPassword: true })  // TODO error handling with frontend
    }
})

module.exports = router
