const { randomBytes } = require('crypto')

module.exports = class CSRFToken {
    /** @type {string} The name of the token, used for the name parameter of the html input element and the cookie */
    #tokenName
    /** @type {string} The request target of the form */
    #target
    /** @type {string} The http method used by the form */
    #httpMethod
    /** @type {string} A randomly generated token which should be included in the form */
    #formToken
    /** @type {string} A randomly generated token which should be included in a dedicated cookie */
    #cookieToken
    /** @type {Date} A timestamp indicating when this token becomes invalid */
    #validUntil

    /**
     * Constructs a new CSRFToken object, creating both required tokens in the process
     * @param {string} target The target of the form this token is used for 
     * @param {string} httpMethod The http method used by the form this token is used for
     * @param {number} tokenLength The amount of initial bytes generated for each token, note that thanks to base64 encoding the tokens itself will be a bit longer
     * @param {number} tokenTimeout The amount of time the token is considered valid after creation in ms
     */
    constructor(target, httpMethod, tokenLength, tokenTimeout) {
        //this.#tokenName = `CSRF_${randomBytes(16).toString('base64url')}` 
        this.#tokenName = 'csrf_token'
        this.#target = target
        this.#httpMethod = httpMethod
        this.#formToken = randomBytes(tokenLength).toString('base64url')
        this.#cookieToken = randomBytes(tokenLength).toString('base64url')
        this.#validUntil = new Date(Date.now() + tokenTimeout)
    }

    /**
     * Generates an input html tag containing the form token and the auto-generated token name
     * @returns {string} The generated input tag
     */
    htmlFormTag() {
        return `<input name="${this.#tokenName}" type="hidden" value="${this.#formToken}"/>`
    }

    jsonToken() {
        return { name: this.#tokenName, value: this.#formToken, html: this.htmlFormTag() }
    }

    isExpired() {
        return Date.now() > this.#validUntil.getTime()
    }

    getExpirationDate() {
        return new Date(this.#validUntil)
    }

    getTokenName() {
        return this.#tokenName
    }

    getTarget() {
        return this.#target
    }

    getHTTPMethod() {
        return this.#httpMethod
    }

    getFormToken() {
        return this.#formToken
    }

    getCookieToken() {
        return this.#cookieToken
    }

}
