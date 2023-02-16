const { AssertionError } = require('assert')
const { join } = require('path')

const readline = require('readline-sync')


module.exports = class Test {

    /** @type {string} */
    testFile
    /** @type {{name: string, fn: Function}[]} Functions to be executed before testing should start */
    init = []
    /** @type {{name: string, fn: Function}[]} Functions to be executed before every test */
    before = []
    /** @type {{name: string, fn: Function}[]} Tests */
    test = []
    /** @type {{name: string, fn: Function}[]} Functions to be executed after every test */
    after = []
    /** @type {{name: string, fn: Function}[]} Functions to be executed after testing finishes */
    cleanUp = []

    constructor(path, fileName) {
        this.testFile = fileName ? join(path, fileName) : path
    }


    async #runInit() {
        for (let i = 0; i < this.init.length; i++) {
            process.stdout.clearLine(0)
            process.stdout.write(`[${i+1}/${this.init.length}] Running init function ${this.init[i].name}...`.blue + '\r')
            await this.init[i].fn()
        }
        process.stdout.clearLine(0)
        console.log(`[${this.init.length}/${this.init.length}] Done running init functions\n`)
    }

    async #runBefore() {
        for (let i = 0; i < this.before.length; i++) {
            process.stdout.clearLine(0)
            process.stdout.write(`[${i+1}/${this.before.length}] Running before function ${this.before[i].name}...`.blue + '\r')
            await this.before[i].fn()
        }
        process.stdout.clearLine(0)
        console.log(`[${this.before.length}/${this.before.length}] Done running before functions`)
    }

    async #runAfter() {
        for (let i = 0; i < this.after.length; i++) {
            process.stdout.clearLine(0)
            process.stdout.write(`[${i+1}/${this.after.length}] Running after function ${this.after[i].name}...`.blue + '\r')
            await this.after[i].fn()
        }
        process.stdout.clearLine(0)
        console.log(`[${this.after.length}/${this.after.length}] Done running after functions\n`)
    }

    async #runTests() {
        let results = {}
        for (let i = 0; i < this.test.length; i++) {
            await this.#runBefore()

            const name = this.test[i].name
            process.stdout.clearLine(0)
            process.stdout.write(`[${i+1}/${this.test.length}] Running test ${name}...`.blue + '\r')
            try {
                const r = (await this.test[i].fn())
                results[name] = typeof r === 'string' ? r : r !== false
            } catch (error) {
                if (error instanceof AssertionError)
                    results[name] = error.message
                else
                    results[name] = error
            }

            process.stdout.clearLine(0)
            const r = results[name]
            if (r === true)
                console.log(`[${i+1}/${this.test.length}] Completed test ${name}: success`.green)
            else if (r === false)
                console.log(`[${i+1}/${this.test.length}] Completed test ${name}: failure`.red)
            else if (typeof r === 'string')
                console.log(`[${i+1}/${this.test.length}] Completed test ${name}: failure (${r})`.red)
            else {
                console.log(`[${i+1}/${this.test.length}] Completed test ${name}: error`.red)
                console.log(r)
            }

            await this.#runAfter()
        }
        return results
    }

    async #runCleanUp() {
        for (let i = 0; i < this.cleanUp.length; i++) {
            process.stdout.clearLine(0)
            process.stdout.write(`[${i+1}/${this.cleanUp.length}] Running clean-up function ${this.cleanUp[i].name}...`.blue + '\r')
            await this.cleanUp[i].fn()
        }
        process.stdout.clearLine(0)
        console.log(`[${this.cleanUp.length}/${this.cleanUp.length}] Done running clean-up functions\n`)
    }

    async run() {
        console.log(`\nBeginning test ${this.testFile}\n`)
        await this.#runInit()
        const results = await this.#runTests()
        await this.#runCleanUp()

        let sc = 0, fc = 0, ec = 0, rc = 0
        for (const k in results) {
            rc++
            if (results[k] === true) sc++
            else if (results[k] === false || typeof results[k] === 'string') fc++
            else ec++
        }

        if (sc === rc)
            console.log(`Test succeeded! Summary: success=[${sc}/${rc}], failure=[${fc}/${rc}], error=[${ec}/${rc}]\n`.green)
        else
            console.log(`Test failed! Summary: success=[${sc}/${rc}], failure=[${fc}/${rc}], error=[${ec}/${rc}]\n`.red)
    }


    pushInit(init) {
        for (const k in init)
            this.init.push({ name: k, fn: init[k] })
    }

    pushBefore(before) {
        for (const k in before)
            this.before.push({ name: k, fn: before[k] })
    }

    pushTests(test) {
        for (const k in test)
            this.test.push({ name: k, fn: test[k] })
    }

    pushAfter(after) {
        for (const k in after)
            this.after.push({ name: k, fn: after[k] })
    }

    pushCleanUp(cleanUp) {
        for (const k in cleanUp)
            this.cleanUp.push({ name: k, fn: cleanUp[k] })
    }

}