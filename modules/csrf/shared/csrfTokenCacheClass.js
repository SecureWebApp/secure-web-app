const CSRFToken = require('./csrfTokenClass')

/** @extends {Map<string, CSRFToken[]>} */
module.exports = class CSRFTokenCache extends Map {

    #tmFilter(target, method) {
        return v => v.getTarget() === target && v.getHTTPMethod() === method
    }

    /**
     * If a single token is passed it replaces a token with a matching 
     * if a token array is passed it replaces the existing array.
     * @param {string} sid The session id
     * @param {CSRFToken | CSRFToken[]} token The token or token array
     * @returns {this}
     */
    set(sid, token) {
        // if argument is array -> replace
        if (Array.isArray(token))
            return super.set(sid, token)

        const arr = super.get(sid)
        
        // if no array for sid was created yet -> insert token packed inside a newly created array
        if (!arr)
            return super.set(sid, [token])

        // check for a token matching this token's target and method
        const ti = arr.findIndex(this.#tmFilter(token.getTarget(), token.getHTTPMethod()))
        if (ti < 0) // if none exist -> add token to the array
            arr.push(token)
        else        // if one does exist -> replace with new token
            arr[ti] = token
        return this
    }

    /**
     * If only sid is passed the token array is returned, 
     * if additionally target and method are passed only the matching token is returned or null if none exist.
     * Additionally if a single token is fetched (with target & method) it is removed from the cache.
     * @param {string} sid The session id
     * @param {?string} target The token's target. If passed method should be passed too.
     * @param {?string} method The token's method. If passed target should be passed too.
     * @returns {?(CSRFToken | CSRFToken[])}
     */
    get(sid, target, method) {
        const arr = super.get(sid)
        
        if (!arr || !target || !method)
            return arr
        
        const ti = arr.findIndex(this.#tmFilter(target, method))
        if (ti < 0)
            return null
        return arr.splice(ti, 1)[0]
    }

}
