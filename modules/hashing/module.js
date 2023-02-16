/**
 * This module provides stubs for functions which can be used for hashing sensitive data like passwords.
 * This module serves as a layer of abstraction between the hashing function provider and consumer,
 * this allows for different hashing methods to be used without demanding any change in another module.
 */

const logger = process.logger('hashing')

/**
 * @typedef {Object} HashingFunctions
 * @property {((any) => any)} HashingFunctions.hash This function calculates the hash value of the provided data.
 * @property {((data: any, hashed: any) => boolean)} HashingFunctions.compare This function compares a hash value with a non-hashed value to check for equality.
 */

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = () => {
    /** @type {HashingFunctions} */
    let hashing = {
        hash: async data => {
            logger.warn('Cannot create hash value: No hashing function registered!')
            return data
        },
        compare: async (data, hashed) => {
            return (await hashing.hash(data)) == hashed 
        }
    }
    return { hashing }
}
