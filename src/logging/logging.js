const Logger = require('./shared/loggerClass')

/** @type {Map<string, Logger>} */
const loggerCache = new Map()

/** @typedef {'error'|'warn'|'info'|'verbose'|'debug'} LogLevel */

const logLevelTable = {
    error: 0,
    warn: 10,
    info: 20,
    verbose: 30,
    debug: 40
}

/**
 * This function tests if a message log level is active by comparing it to the current active log level.
 * @param {LogLevel} msgLogLevel The message log level
 * @param {LogLevel} activeLogLevel The current active log level
 * @returns {boolean} If the message log level is active
 */
function testLogLevel(msgLogLevel, activeLogLevel) {
    return logLevelTable[msgLogLevel] <= logLevelTable[activeLogLevel]
}

/**
 * This function logs a message to stdout, but only if it's log level is activated
 * @param {LogLevel} level The log level of the message
 * @param {string} msg The message to log
 * @returns {boolean} If the message could be logged
 */
function log(level, msg) {
    if (!testLogLevel(level.toLowerCase(), process.env.logLevel))
        return false
    console.log(msg)
    return true
} 

/**
 * This function retrieves a logger for a given namespace from the logger cache.
 * If no logger is found within the cache a new one is created.
 * @param {string} namespace The namespace this logger is for
 * @returns {Logger} A logger for the given namespace
 */
function logger(namespace) {
    let l = loggerCache.get(namespace)
    if (l) return l
    l = new Logger(namespace, log)
    loggerCache.set(namespace, l)
    return l
}

// inject logger function into process for easy access
process.logger = logger

module.exports = { log, logger }
