/// Imports

const { inspect } = require('util')

/** @type {import("../../../src/modules/shared/moduleCacheClass")} */
const moduleCache = require(process.modules)
/** @type {import("../../../src/database/db")} */
const db = require(process.database)

const { hashing } = moduleCache.require('hashing')

const logger = process.logger('login')


/// Private (internal) definitions

async function resolve(email) {
    try {
        const queryResult = await db.query('SELECT * FROM UserAccount WHERE email = ?', email)
        if (!queryResult.results?.length)
            return null
        return queryResult.results[0]
    } catch (error) {
        logger.error('Database error while attempting to reslove an email address!')
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}


/// Public (exposed) definitions

/**
 * Function to check if a given password matches the hash in the database for a certain user
 * @param {string} email The email address of the user
 * @param {string} psw The entered password
 * @returns {Promise<any | false>} False if the passwords do not match or no user exists in the database with this email. 
 * If this user exists and the login is valid the user object is returned.
 */
async function validatePassword(email, psw) {
    const data = await resolve(email)
    if (!data)
        return false
    const pswCorrect = await hashing.compare(psw, data.passwordHash.toString())
    if (!pswCorrect)
        return false
    return (await db.query('SELECT * FROM User WHERE accountId = ?', data.accountId)).results[0]
}

/**
 * Function to check if an email address is still available or already in use
 * @param {string} email The email to check
 * @returns {Promise<boolean>} True if the email address is still free, false otherwise
 */
async function checkEmail(email) {
    return !await resolve(email)
}

/**
 * Function to register a user. Specifically this function creates a user with account and profile and commits it to the database.
 * @param {any} userAccount The key-value pairs to be saved in the UserAccount table 
 * @param {any} userProfile The key-value pairs to be saved in the UserProfile table
 * @returns {Promise<number>} An error code, 0 = success, 1 = email in use, 2 = missing values, 3 = unknown database error
 */
async function register(userAccount, userProfile) {
    // collect account keys & values
    let accountKeys = [], accountValues = []
    for (const k in userAccount) {
        accountKeys.push(k)
        accountValues.push(userAccount[k])
    }
    // collect profile keys & values
    let profileKeys = [], profileValues = []
    for (const k in userProfile) {
        profileKeys.push(k)
        profileValues.push(userProfile[k])
    }

    // check necessary keys
    if (!(accountKeys.includes('email') && accountKeys.includes('passwordHash') && profileKeys.includes('userName'))) {
        logger.error('Missing necessary values to register a user!')
        return 2
    }
    // check if email address is free
    if (await resolve(accountValues['email']))
        return 1

    const transaction = await db.openTransaction()
    try {
        logger.debug('Registering account with values:')
        logger.debug(`    account: email = '${userAccount.email}'`)
        logger.debug(`    profile: (${inspect(userProfile)})`)

        // create user account
        let params = accountKeys.join(', '), values = accountKeys.map(() => '?').join(', ')
        let accountId
        await transaction.query(res => accountId = res.insertId, `INSERT INTO UserAccount(${params}) VALUES (${values})`, ...accountValues)
        // create user profile
        params = profileKeys.join(', '), values = profileKeys.map(() => '?').join(', ')
        let profileId
        await transaction.query(res => profileId = res.insertId, `INSERT INTO UserProfile(${params}) VALUES (${values})`, ...profileValues)
        // create user
        await transaction.exec(`INSERT INTO User(accountId, profileId) VALUES (?, ?)`, accountId, profileId)
        // commit transaction
        await transaction.commit()
        return 0
    } catch (error) {
        await transaction.rollback()
        logger.error('Something went wrong while registering a user!')
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return 3
    }
}


module.exports = {
    validatePassword,
    checkEmail,
    register
}
