/** @typedef {'error'|'warn'|'info'|'verbose'|'debug'} LogLevel */

/**
 * This class allows for simple, organized logging
 */
module.exports = class Logger {
    /** @type {string} The namespace this logger is for. This string is prefixed before any message logged by the logger, this allows for easy identification */
    namespace
    /** @type {(level: LogLevel, msg: string) => void} */
    #logfn

    constructor(namespace, logfn) {
        this.namespace = namespace
        this.#logfn = logfn
    }

    #padLevel(level) {
        return `${level}${' '.repeat(7 - level.length)}`
    }

    #padNum(num) {
        return num < 10 ? `0${num}` : `${num}`
    }
    
    #time() {
        const time = new Date()
        return `${this.#padNum(time.getHours())}:${this.#padNum(time.getMinutes())}:${this.#padNum(time.getSeconds())}`
    }

    #format(level, msg) {
        let nl = ''
        while (msg.startsWith('\n')) {
            nl += '\n'
            msg = msg.substring(1)
        }
        return `${nl}${this.#time()} ${this.#padLevel(level)} ${this.namespace}: ${msg}`
    }

    error(msg) {
        this.#logfn('error', this.#format('ERROR', msg).red)
    }

    warn(msg) {
        this.#logfn('warn', this.#format('WARN', msg).yellow)
    }

    info(msg) {
        this.#logfn('info', this.#format('INFO', msg).blue)
    }

    verbose(msg) {
        this.#logfn('verbose', this.#format('VERBOSE', msg))
    }

    debug(msg) {
        this.#logfn('debug', this.#format('DEBUG', msg).gray)
    }

}