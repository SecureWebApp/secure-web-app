/**
 * This module provides basic register, login and dashboard pages with their corresponding logic.
 */

/**
 * @callback LoginHookCallback
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {?any} error
 *//**
 * @callback LoginHook
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {LoginHookCallback} callback 
 *//**
 * @callback RegisterHookCallback
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {object} accountInsertValues
 * @param {object} profileInsertValues
 * @param {?any} error
 *//**
 * @callback RegisterHook
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {RegisterHookCallback} callback
 */

/** @type {LoginHook[]} */
const loginHooks = []
/** @type {RegisterHook[]} */
const registerHooks = []

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache) => {
    let { options } = cache.require('authenticate')
    options.whitelist.push('/', '/login', '/register')
    options.onFailureRedirectTarget = '/'
    
    return { loginHooks, registerHooks }
}
