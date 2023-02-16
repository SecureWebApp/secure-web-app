const fs = require('fs')
const { join } = require('path')
const { randomBytes } = require('crypto')

const readline = require('readline-sync')

require('colors')


/*
 * Randomize passwords in .env
 */

const pswTargets = ['$1', '$2', '$3']
const passwordStrength = 32

const dotenvSrcPath = join(process.cwd(), 'bin', 'res', 'env-template.env')
const dotenvDestPath = join(process.cwd(), '.env')

if (!fs.existsSync(dotenvSrcPath)) {
    console.error('Could not randomize passwords: bin/res/env-template.env does not exist!'.red)
    console.info('Please ensure that a file called env-template.env does exist in the bin/res folder and that this scrpt was launched using npm install.'.yellow)
    process.exit(1)
}

if (fs.existsSync(dotenvDestPath)) {
    console.warn(`A file called .env already exists in project root!`.yellow)
    console.info(`Proceeding beyond this point will OVERWRITE the existing .env file!`.yellow)
    console.info(`This means that your custom configuration will be DELETED, including your randomized database passwords!`.yellow)
    console.info(`Proceeding will make your current SWA databases inaccessible, unless you backed up your passwords before!`.yellow)
    console.info(`Only proceed if you know what your doing!\n`.yellow.bold)
    if (!readline.keyInYNStrict('Do you want to proceed with the installation?')) {
        console.info(`Aborting installation...`)
        process.exit(0)
    }
    console.log()
}

// read .env file
let dotenv = fs.readFileSync(dotenvSrcPath).toString()

// remove warn comments
const warnCommentRegex = /^#!.*(\n|$)/gm
dotenv = dotenv.replace(warnCommentRegex, '')

// insert randomized passwords
for (const target of pswTargets) {
    if (!dotenv.includes(target)) {
        console.error('Could not randomize passwords in .env: Missing targets!'.red)
        console.info('This can occur if the env-template.env file is corrupted.'.yellow)
        process.exit(3)
    }
    dotenv = dotenv.replace(target, randomBytes(passwordStrength).toString('base64'))
    console.debug(`Replaced ${target} with a randomized password.`.gray)
}

// write .env file
fs.writeFileSync(dotenvDestPath, dotenv)
