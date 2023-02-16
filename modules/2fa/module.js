const qrcode  = require('qrcode')

const moduleCache = require(process.modules)
const cache = require('./cache')
const { generateSecret } = require('./util/secret')

/** @type {import('../csrf/types').csrf} */
const csrf = moduleCache.require('csrf').csrf

/** @type {import('../../src/logging/shared/loggerClass')} */
const logger = process.logger('2fa')


/**
 * This module provides two-factor authentication during registeration and login operations.
 */

/** @type {import('../login/module').LoginHook} */
function loginHook(req, res, callback) {
    logger.debug(`Beginning 2fa login process for ${req.sessionID}`)

    // save login callback
    cache.loginCache.set(req.sessionID, callback)
    // render 2fa validation page
    csrf(req, res, '/login/2fa')
    res.render('validateToken')
}

/** @type {import('../login/module').RegisterHook} */
async function registerHook(req, res, callback) {
    logger.debug(`Beginning 2fa register process for ${req.sessionID}`)

    // save register callback
    cache.registerCache.set(req.sessionID, callback)

    // generate 2fa secret
    const secret = generateSecret()
    const qrCode = await qrcode.toDataURL(secret.otpauth_url)

    // save secret and qrcode to session
    req.session.secret = secret.base32
    req.session.qrCode = qrCode

    // render 2fa generation page
    csrf(req, res, '/register/2fa')
    res.render('generateSecret', { qrCode })
}


/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache) => {
    let { options } = cache.require('authenticate')
    options.whitelist.push('/login/2fa', '/register/2fa')

    logger.debug('Adding 2fa hooks to login')
    const login = cache.require('login')
    login.loginHooks.push(loginHook)
    login.registerHooks.push(registerHook)
}
