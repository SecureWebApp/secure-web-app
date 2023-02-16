/// Imports

const { createServer } = require('http')
const Logger = require('./logging/shared/loggerClass')


/// Logger

/** @type {Logger} */
const logger = process.logger('Server')

/// Server setup

// load application
/** @type {import('express').Application} */
const app = require(process.join('src', 'app.js'))

// port
const port = process.env.appPort
app.set('port', port)

// create server
const server = createServer(app)
app.once('app.isReady', () => server.listen(port))

// bind listeners
server.on('error', onError)
server.on('listening', onListening)


/// Listeners

/**
 * Listener for server errors, specifically errors caused by the listen call
 * @param {Error} e 
 */
function onError(e) {
    // pass error if not caused by listen call
    if (e.syscall !== 'listen')
        throw e

    switch (e.code) {
        case 'EADDRINUSE':
            logger.error(`${port} is already in use!`)
            process.exit(2)
        // Included in case port becomes a config entry later
        case 'EACCESS':
            logger.error(`${port} requires elevated privileges!`)
            process.exit(1)
        default:
            throw e
    }
}

/**
 * Simple listener logging to the console once the server is listenting
 */
function onListening() {
    logger.info(`Server is listening on port ${server.address().port}.\n`.bold)
}
