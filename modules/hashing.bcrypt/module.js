const bcrypt = require('bcrypt')

const logger = process.logger('hashing.bcrypt')

/**
 * This module extends the hashing module to use hashing functions provided by bcrypt.
 * Naturally this module requires the hashing module to be loaded.
 */

/**
 * @typedef {Object} HashingBcryptOptions
 * @property {Number} HashingBcryptOptions.bcryptHashingRounds How many hashing rounds bcrypt should perform.
 */

/** @type {import('../moduleFunction').ModuleFunction} */
module.exports = (app, cache) => {
     /** @type {HashingBcryptOptions} */
    let options = { bcryptHashingRounds: 12 }

    /** @type {import('../hashing/module').HashingFunctions} */
    let hashing = cache.require('hashing').hashing

    // overwrite hashing stubs with bcrypt's hash functions
    logger.info('Installing bcrypt hashing functions')
    hashing.hash = async data => bcrypt.hash(data, options.bcryptHashingRounds)
    hashing.compare = async (data, encrypted) => bcrypt.compare(data, encrypted)

    return options
}
