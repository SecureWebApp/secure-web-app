#!/usr/bin/env node

/// Imports

// Vanilla
const { join } = require('path')

// dotenv
const { config } = require('dotenv')

// colors (for colored cli output)
require('colors')


/// Environment setup

/**
 * @callback ValueConverter This function converts the input string into any other value.
 * This allows for semi-automated processing of the strings read from the .env file(s)
 * The return value of this function is saved in process.env as value for the corresponding key.
 * @param {string} value The value to be converted
 * @returns {any} The result of the conversion
 *//**
 * @callback ValueConstraint A constraint function for the env key.
 * @param {any} value This function receives the value returned by the converter (if a converter was set) or the original string otherwise.
 * @returns {boolean} If the value passes the constraint. If false the value is rejected and an error is thrown.
 *//**
 * @typedef {object} EnvKeySpec
 * @property {?ValueConverter} EnvKeySpec.converter 
 * @property {?ValueConstraint} EnvKeySpec.constraint 
 */

/** @type {(cond: Function, acceptEmpty: boolean) => ValueConstraint} simple constraint function factory for value lists  */
const list = (cond, acceptEmpty) => ( str => str.includes(',') ? str.split(',').every(cond) : ((acceptEmpty && str === '') || cond(str)) )

/** @type {RegExp} log level regular expression */
const llRegex = /^(error|warn|info|verbose|debug)$/
/** @type {ValueConstraint} generic constraint function for ports */
const portfn = port => !isNaN(port) && port >= 0 && port <= 65535
/** @type {ValueConstraint} simple constraint testing if a valid userid was passed (not if the user actually exists) */
const adminfn = list(uid => parseFloat(uid) % 1 === 0, true)
/** @type {ValueConverter} generic converter function which invalidates any value it receives */
const invalidate = () => undefined

/** 
 * @type {Object.<string, EnvKeySpec>} A map which provides mappings for all env keys.
 * Every key needs an entry in this map, otherwise it's rejected.
 */
const keyMap = {
    // general
    appName: {},
    appPort: { converter: parseInt, constraint: portfn },
    logLevel: { converter: v => v.toLowerCase(), constraint: level => llRegex.test(level) },
    // chat
    adminUsers: { converter: v => v.replace(' ', ''), constraint: adminfn },
    // database - general configuration
    databaseRootPassword: { converter: invalidate },
    databaseDockerPort: { converter: invalidate },
    // database - app configuration
    appDatabase: {},
    appDatabaseUser: {},
    appDatabasePassword: {},
    appDatabaseHost: {},
    appDatabasePort: { converter: parseInt, constraint: portfn },
    // database - session configuration
    sessionDatabase: {},
    sessionDatabaseUser: {},
    sessionDatabasePassword: {},
    sessionDatabaseHost: {},
    sessionDatabasePort: { converter: parseInt, constraint: portfn },
    // proxy configuration
    hostHTTPPort: { converter: invalidate },
    hostHTTPSPort: { converter: invalidate },
    proxyHTTPPort: { converter: parseInt, constraint: portfn },
    proxyHTTPSPort: { converter: parseInt, constraint: portfn }
}

// Load defaults from .env
const defaults = config()
if (defaults.error) {
    console.error('An error occured while parsing default keys!'.red)
    throw defaults.error
}
let envValues = defaults.parsed

// Validate and parse values
for (const pair of Object.entries(envValues)) {
    // lookup key
    const keySpec = keyMap[pair[0]]
    if (!keySpec) {
        // warn about missing specification, continue with next value
        console.warn(`Key ${pair[0]} is not specified.`.yellow)
        continue
    }
    
    // if converter is defined for keySpec: call converter and save return as value
    let value = keySpec.converter ? keySpec.converter(pair[1]) : pair[1]
    // check constraint function, fail if constraint function is defined and returns false
    if (keySpec.constraint && !keySpec.constraint(value))
        throw new Error(`Parsing failed for key ${pair[0]}: Value "${pair[1]}" is invalid.`)
    process.env[pair[0]] = value
}

/// Additional definitions

// Constant reference to project root in case the working directory gets changed during execution (for instance via cd)
/** Project Root */
process.env.projectDir = process.cwd()

// Paths to interfaces for quick require
/** Path to database interface */
process.database = join(process.env.projectDir, 'src', 'database', 'db.js')
/** Path to module cache */
process.modules = join(process.env.projectDir, 'src', 'modules', 'modules.js')
/** Path to module loader */
process.loader = join(process.env.projectDir, 'src', 'modules', 'loader.js')
/** Path to logging */
process.logging = join(process.env.projectDir, 'src', 'logging', 'logging.js')

/**
 * A convenience function which joins path segments into a single path relative to project root
 * @param  {...string} v the path segments to be joined together
 * @returns all passed path segments joined together, relative to project root
 */
process.join = (...v) => join(process.env.projectDir, ...v)


/// Load application

// load logging utilities
require(process.logging)
// load server
require(process.join('src', 'server.js'))
