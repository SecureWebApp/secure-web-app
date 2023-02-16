#!/usr/bin/env node

const fs = require('fs')
const { join } = require('path');
const Test = require('./shared/testClass');

require('colors')


process.projectRoot = process.cwd()

;(async () => {
    const testDir = join(__dirname, 'src')
    const tests = []
    ;(function deep(path) {
        for (const f of fs.readdirSync(path, { withFileTypes: true })) {
            const fp = join(path, f.name)
            if (f.isFile() && fp.endsWith('.js'))
                tests.push(fp)
            else if (f.isDirectory())
                deep(fp)
        }
    })(testDir)

    console.log(`Running tests...`)
    for (const t of tests) {
        const test = require(t)
        if (test instanceof Test)
            await test.run()
        else
            console.warn(`Export of ${t} is not a test object!`.yellow)
    }
})()
