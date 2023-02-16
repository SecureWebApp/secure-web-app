const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const mysql2 = require("mysql2/promise");

/**
 * This module configures express session to use a persistant mysql session store
 * instead of the default in-memory store.
 */

const options = {
    port: process.env.sessionDatabasePort,
    host: process.env.sessionDatabaseHost,
    database: process.env.sessionDatabase,
    user: process.env.sessionDatabaseUser,
    password: process.env.sessionDatabasePassword,
};

const connection = mysql2.createPool(options);
const sessionStore = new MySQLStore({}, connection);

/** @type {import('../moduleFunction').ModuleFunction} */
module.exports = (app, cache, logger) => {
    logger.info('Installing mysql session store')
    let { options } = cache.require('session')
    options.unset = 'destroy'
    options.resave = false
    options.store = sessionStore
}
