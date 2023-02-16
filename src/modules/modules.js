/// Imports

const ModuleCache = require("./shared/moduleCacheClass")


/// Public (exposed) defintions

const globalModuleCache = new ModuleCache()
module.exports = globalModuleCache
