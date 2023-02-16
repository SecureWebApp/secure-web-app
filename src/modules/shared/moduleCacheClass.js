const Module = require("./moduleClass");

/**
 * @extends {Map<string, Module>}
 */
module.exports = class ModuleCache extends Map {

    /**
     * This function returns the exports object of a module or throws an exception 
     * if no module with name moduleName is contained within the cache.
     * 
     * This function can be considered as a mirror of the nodejs internal {@link require} function for SWA modules.
     * 
     * @param {string} moduleName The name (key) of the module.
     * @param {?boolean} doNotThrow If true no exception will be thrown if the module does not exist and undefnied is returned instead.
     * @returns {any} The {@link Module.exports} object of the selected module.
     */
    require(moduleName, doNotThrow) {
        const module = this.get(moduleName)
        if (module || doNotThrow)
            return module?.exports
        throw new Error(`Module ${moduleName} was not found!`)
    }

}
