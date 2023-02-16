/** @type {import('../../../src/database/db')} */
const db = require(process.database)
const logger = process.logger('2fa')

/**
 * Function to get user secret to be verfied in 2FA during login
 * @param {number} accountId The account id of the user account
 * @returns {Promise<string | false>} The user's secret
 */
async function getUserSecret(accountId) {
    try {
        const data = (await db.query(`SELECT * FROM UserAccount WHERE accountId = ?`, accountId)).results[0]
        if (data?.twoFASecret)
            return data.twoFASecret.toString()
        logger.warn(`Failed to load 2fa secret for user with account ${accountId}.`)
        return false
    } catch (error) {
        logger.error(`Unexpected database error!`)
        logger.error(error)
        return false
    }
}

module.exports = { getUserSecret }
