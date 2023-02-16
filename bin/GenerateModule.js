#!/usr/bin/env node

/**
 * This script generates a new template module in modules
 */

const fs = require('fs')
const readline = require('readline-sync')
const { join } = require('path')

const basePath = './modules'


// DATA
const moduleJsTemplate = `/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger, module) => {
    /* your code here */
    return { /* your exports here */ }
}
`

const metaJsonTemplate = `{
    "author": "your or your groups name",
    "version": "your module version",
    "description": "a short description of your module",
    "requires": ["modules that your module needs"],
    "depends": ["modules that should be loaded BEFORE your module"],
    "prepends": ["modules that should be loaded AFTER your module"],
    "yourkey": "these values can be accessed with yourModuleObject.meta"
}
`


let modulePath
readline.promptLoop(value => {
    if (fs.existsSync((modulePath = join(basePath, value)))) {
        console.log(`Module "${value}" already exists!`)
        modulePath = null
        return false
    }
    return true
}, { prompt: 'Enter module name: ' })

if (!modulePath)
    process.exit(1)

if (readline.keyInYN(`Generate new module in ${modulePath}?`)) {
    const folders = ['public', 'public/img', 'public/js', 'public/css', 'views', 'routes']
    fs.mkdirSync(modulePath)
    folders.forEach(v => fs.mkdirSync(join(modulePath, v)))
    fs.writeFileSync(join(modulePath, 'module.js'), moduleJsTemplate)
    fs.writeFileSync(join(modulePath, 'meta.json'), metaJsonTemplate)
}
