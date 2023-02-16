/** @type {Map<string, import("../login/module").LoginHookCallback>} */
const loginCache = new Map()
/** @type {Map<string, import("../login/module").RegisterHookCallback>}  */
const registerCache = new Map()

module.exports = { loginCache, registerCache }
