const { randomBytes, Encoding } = require('crypto')

/**
 * @callback SecretGenerator
 * @param {?number} strength The generated secrets strength
 * @param {?Encoding} encoding The encoding used to transform the generated value into a string if applicable
 * @returns {any} The generated secret
 *//**
 * @typedef {object} SharedSecretsOptions
 * @property {SecretGenerator} SharedSecretsOptions.secretGenerator The generator function used to generate new secrets
 * @property {number} SharedSecretsOptions.defaultStrength The default strength to be used if no other value was passed to the generator
 * @property {Encoding} SharedSecretsOptions.defaultEncoding The default encoding to be used if no other value was passed to the generator
 */

 /** @type {SharedSecretsOptions} */
let options = {
    secretGenerator: byteGenerator,
    defaultStrength: 64,
    defaultEncoding: 'base64'
}

/** @type {{string: any}} The in-memory cache of generated secrets */
let secretCache = {}

/** @type {SecretGenerator} */
function byteGenerator(strength, encoding) {
    return randomBytes(strength || options.defaultStrength).toString(encoding || options.defaultEncoding)
}


/**
 * Function which retrieves the secret from the secret cache which matches the given key and otherwise generates a new secret.
 * @param {string} key The key of the secret.
 * @param {?number} strength If no secret with this key exists: How strong the newly generated secret should be.
 * @param {?Encoding} encoding If no secret with this key exists: How the newly generated secret should be encoded.
 * @returns {any} The retrieved or newly generated secret.
 */
function secret(key, strength, encoding) {
    if (secretCache[key])
        return secretCache[key] 
    return (secretCache[key] = options.secretGenerator(strength, encoding))
}


/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = () => ({ secret, options })
