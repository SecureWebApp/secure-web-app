/**
 * This module prevents xss attacks by html-escaping ALL body parameters contained within the request.
 * It also exports both an escape and unescape function which can be used by other modules.
 * Unescaped body parameters can still be accessed via the request.unsafeBody object.
 * 
 * For this module to work correctly some considerations must be made:
 * 
 * - ALL body parameters are escaped, this can cause unintended side effects if the exact user input is required.
 *   To receive unescaped body parameters the request.unsafeBody object can be used instead of the request.body object.
 * 
 * - If body parameters are be passed back and forth between the client and the application repetitive escapes can be created,
 *   where the & of the escape is again escaped, causing unintended side effects. To prevent this avoid a situation where body
 *   parameters are passed back and fourth continously.
 */

/* HTML escape method copied from Stephen Quan (https://stackoverflow.com/a/30970751) */

const escapeTable = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;'
}

const reverseTable = (() => {
    let tmp = {}
    for (const k in escapeTable)
        tmp[escapeTable[k]] = k
    return tmp
})()

const escapeRegex = /[&"'<>]/g
const reverseRegex = /(&amp;)|(&quot;)|(&apos;)|(&lt;)|(&gt;)/g

/**
 * HTML escapes the passed string 
 * @param {string} s the string to escape
 * @returns {string} the escaped string (null if no string was passed)
 */
function escape(s) {
    if (typeof s !== 'string')
        return null
    return s.replace(escapeRegex, match => escapeTable[match])
}

/**
 * Utility function which undos the HTML escape
 * @param {string} s the string to unescape
 * @returns {string} the unescaped string (null if no string was passed)
 */
function unescape(s) {
    if (typeof s !== 'string')
        return null
    return s.replace(reverseRegex, match => reverseTable[match])
}


/**
 * @typedef {Object} HTMLEscapeExports
 * @property {((string) => string)} HTMLEscapeExports.escape A utility function which html-escapes a given string.
 * @property {((string) => string)} HTMLEscapeExports.unescape A utility function which reveses a html-escape for a given string.
 */

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    const escapeMw = (req, res, next) => {
        req.unsafeBody = {}
        for (const k in req.body) {
            req.unsafeBody[k] = req.body[k]
            req.body[k] = escape(req.body[k])
        }
        next()
    }
    
    // insert escaping middleware into all post, put and patch requests
    logger.info('Installing html escape middleware to post, put, patch and delete')
    app.post('*', escapeMw)
    app.put('*', escapeMw)
    app.patch('*', escapeMw)
    app.delete('*', escapeMw)

    /** @type {HTMLEscapeExports} */
    return { escape, unescape }
}
