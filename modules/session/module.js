/**
 * This module prepares the express session middleware but does not yet add it
 * to the application, this allows for session options to be changed by other modules.
 * To finalize the setup and to apply the session middleware an additional module called session.build should be loaded, 
 * note that after session.build is loaded session options can no longer be changed.
 */

/** @type {import('express-session').SessionOptions} */
let options = {
    secret: 0,                                  // The true secret is assigned in session.build
    cookie: { httpOnly: true, secure: true, sameSite: 'lax' }, 
    saveUninitialized: false
}

/** @type {import('../moduleFunction').ModuleFunction} */
module.exports = () => ({ options })
