const CSRFToken = require('./shared/csrfTokenClass')
const CSRFTokenCache = require('./shared/csrfTokenCacheClass')

const logger = process.logger('csrf')

const globalCSRFCache = new CSRFTokenCache()

/**
 * @typedef {object} CSRFOptions
 * @property {number} CookieOptions.tokenByteLength The amount of bytes generated for each anti-csrf token (default: 128)
 * @property {number} CookieOptions.tokenExpirationTime The amount of time in ms until the anti-csrf token expires (default: 10 min)
 * @property {import("express").CookieOptions} CSRFOptions.cookie The cookie options of the anti-csrf token cookie, signed should always be true.
 */

/** @type {CSRFOptions} */
let options = {
    tokenByteLength: 32,
    tokenExpirationTime: 600000,
    cookie: {
        httpOnly: true,
        secure: true,
        signed: true,
        sameSite: 'lax'
    }
}

/**
 * see types.d.ts
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {?string} target
 * @param {?string} method
 * @returns {CSRFToken | false}
 */
function csrf(req, res, target, method) {    
    const sid = req.sessionID
    // abort if client does not yet have a session -> no need for csrf protection as their is no session cookie to exploit
    if (!sid) {
        logger.verbose('Cannot apply csrf tokens: No session established')
        return false
    }
    // mutate the current session, this is necessary to ensure that the session id does not change
    if (!req.session.csrf_ctr)
        req.session.csrf_ctr = 0
    else
        req.session.csrf_ctr++

    const t = target || req.correctUrl, m = method || 'POST'
    const token = new CSRFToken(t, m, options.tokenByteLength, options.tokenExpirationTime)

    // add csrf form tag to locals so it can later be inserted into the form by ejs 
    if (Array.isArray(res.locals.csrf))
        res.locals.csrf.push(token.htmlFormTag())
    else
        res.locals.csrf = [token.htmlFormTag()]
    // add csrf cookie to response
    res.cookie(token.getTokenName(), token.getCookieToken(), options.cookie)
    
    // add token to global cache
    globalCSRFCache.set(sid, [token])
    logger.debug(`Bound token ${token.getTokenName()} to (${m} ${t})`)
    return token
}

/**
 * see types.d.ts
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {?CSRFToken} token
 * @returns {number}
 */
function validate(req, res, token) {
    const sid = req.sessionID
    // if the client has no session it can't have any csrf tokens so the checks fail immediately
    if (!sid) {
        logger.verbose('Cannot verify csrf token: Session not established')
        return 1
    }

    // TODO: Fully remove target & method targeting
    /* const target = req.correctUrl, method = req.method */
    let t = token || globalCSRFCache.get(sid)?.[0]
    globalCSRFCache.delete(sid)

    // test if a token was found
    if (!t) {
        logger.verbose(`Cannot verify csrf token: No matching token found`)
        return 2
    }

    // test if the token is expired
    if (t.isExpired()) {
        logger.verbose('Cannot verify csrf token: Token is expired')
        return 3
    }

    // check cookie token for equality
    const cookie = req.signedCookies[t.getTokenName()]
    // remove cookie
    res.clearCookie(t.getTokenName(), options.cookie)
    if (cookie !== t.getCookieToken()) {
        logger.verbose('Cannot verify csrf token: Cookie tokens do not match')
        return 4
    }
    
    // check form token for equality
    let form = (req.unsafeBody || req.body)[t.getTokenName()]
    if (!form) form = req.headers[t.getTokenName().toLowerCase()]
    if (form !== t.getFormToken()) {
        logger.verbose('Cannot verify csrf token: Form tokens do not match')
        return 4
    }

    logger.debug(`Validated request with token ${t.getTokenName()}`)
    return 0
}


/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = () => ({ csrf, validate, options })
