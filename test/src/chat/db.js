const $ = require('assert')
const { join } = require('path')

const Test = require('../../shared/testClass')
const Logger = require('../../../src/logging/shared/loggerClass')

const toTest = join(process.projectRoot, 'modules', 'chat', 'util', 'db.js')
/** @type {import('../../../modules/chat/util/db.js')} */
let out = {}

// Init

function mockLogger() {
    const mock = new Logger('test', () => {})
    process.logger = () => mock
}


/** @type {import('../../../src/database/db.js')} */
let database
const databasePath = join(process.projectRoot, 'src', 'database', 'db.js')
function mockDatabase() {
    // import db.js naturally to create the relevant cache entry 
    /** @type {import('../../../src/database/db.js')} */
    require(databasePath)
    
    // overwrite test relevant functions
    database = require.cache[databasePath].exports
    database.openTransaction = () => new database.Transaction(null)
}

const modulesPath = join(process.projectRoot, 'src', 'modules', 'modules.js')
function mockModules() {
    // load modules to create the relevant cache entry
    require(modulesPath)

    // hashing stub
    const hashing = { hash: () => {}, compare: () => {} }
    // insert mocked module cache object into exports object
    require.cache[modulesPath].exports = { require: () => ({ hashing }) }
}

function mockProcess() {
    process.database = databasePath
    process.modules = modulesPath
}


// Before

function requireDatabase() {
    out = require(toTest)
}


// Test

const getAllUsersQuery = `\
SELECT User.userId, User.profileId, User.accountId, UserProfile.userName, UserProfile.userDescription, UserAccount.email, UserAccount.twoFAEnabled \
FROM User, UserProfile, UserAccount \
WHERE User.profileId = UserProfile.profileId AND User.accountId = UserAccount.accountId`
async function testGetAllUsers() {
    // Query success, return empty object
    database.query = query => { 
        $(query === getAllUsersQuery)
        return { results: [] }
    }
    // expected: array with array[0] === undefined
    let tmp
    $(!(tmp = await out.getAllUsers())[0], 'Invalid result for getAllUsers [1]')

    // Query throws
    database.query = () => { throw new Error('test') }
    // expected: undefined
    $((tmp = await out.getAllUsers()) === undefined, 'Invalid result for getAllUsers [2]')

    // Query success, return two user objects
    database.query = query => {
        $(query === getAllUsersQuery)
        return { results: [ testUser(1, 'Test1', 1, 1), testUser(2, 'Test2', 3, 4) ] }
    }
    // expected: array of length 2
    $((tmp = await out.getAllUsers()).length === 2, 'Invalid result for getAllUsers [3]')
    // expected: user.userId is equal to the value passed to testUser
    $(tmp[0].userId === 1 && tmp[1].userId === 2, 'Invalid user objects at getAllUsers [4]')
    // expected: user.profile is not undefined, user.profile.profileId should contain the value passed to testUser
    $(tmp[0].profile?.profileId === 1 && tmp[1].profile?.profileId === 3, 'Invalid user profiles at getAllUsers [6]')
    // expected: user.account should be undefined as withAccounts was not true on getAllUsers
    $(tmp[0].account === undefined && tmp[1].account === undefined, 'Invalid user objects at getAllUsers [5]')
    
    // query user objects with accounts
    tmp = await out.getAllUsers(true)
    // expected: user.account is not undefined, user.account.accountId should contain the value passed to testUser
    $(tmp[0].account?.accountId === 1 && tmp[1].account?.accountId === 4, 'Invalid user accounts at getAllUsers [7]')
    // expected: user.profile is not undefined, user.profile.userName should contain the same value passed to testUser
    $(tmp[0].profile.userName === 'Test1' && tmp[1].profile.userName === 'Test2', 'Invalid user name at getAllUsers [8]')
}

const getUserQuery = `\
SELECT User.userId, User.profileId, User.accountId, UserProfile.userName, UserProfile.userDescription, UserProfile.profilePicture, UserAccount.email, UserAccount.twoFAEnabled \
FROM User, UserProfile, UserAccount \
WHERE User.profileId = UserProfile.profileId AND User.accountId = UserAccount.accountId AND User.userId = ?`
async function testGetUser() {
    // Query success, return empty object
    database.query = (query, userId) => {
        $(query === getUserQuery)
        $(userId === 1)
        return { results: [] }
    }

    // expected: undefined / null
    let tmp
    $(!(tmp = await out.getUser(1)), 'Invalid result for getUser [1]')

    // Query throws
    database.query = () => { throw new Error('test') }
    // expected: undefined / null
    $(!(tmp = await out.getUser(1)), 'Invalid result for getUsers [2]')

    // Query success, return a user object
    database.query = (query, userId) => {
        $(query === getUserQuery)
        $(userId === 1)
        return { results: [ testUser(1, 'Test1', 1, 1) ] }
    }
    // expected: user is not undefined, userId is 1
    $((tmp = await out.getUser(1))?.userId === 1, 'Invalid result for getUser [3]: ' + tmp)
    // expected: user profile is not undefined, userName is Test1
    $(tmp.profile?.userName === 'Test1', 'Invalid result for getUser [4]')
    // expected: user account is undefined
    $(tmp.account === undefined, 'Invalid result for getUser [5]')
    // expected: user account is not undefied, accountId is 1
    $((tmp = await out.getUser(1, true)).account?.accountId === 1, 'Invalid result for getUser [6]')
}


async function testGetChats() {
    return 'not yet implemented'
}

async function testGetMessages() {
    return 'not yet implemented'
}

async function testDeleteUser() {
    return 'not yet implemented'
}

async function testDeleteChat() {
    return 'not yet implemented'
}

async function testDeleteMessage() {
    return 'not yet implemented'
}

async function testUpdateProfile() {
    return 'not yet implemented'
}

async function testUpdatePassword() {
    return 'not yet implemented'
}

async function testUpdate2fa() {
    return 'not yet implemented'
}

async function testSendMessage() {
    return 'not yet implemented'
}


// After

function removeDatabaseFromCache() {
    delete require.cache[toTest]
}


// Clean up

function removeMocks() {
    delete require.cache[databasePath]
    delete require.cache[modulesPath]
    delete process.logger
    delete process.database
    delete process.modules
}


// util

function testUser(userId, userName, profileId, accountId) {
    return {
        userId,
        profileId,
        accountId,
        userName
    }
}


const test = new Test(__filename)
test.pushInit({ mockLogger, mockDatabase, mockModules, mockProcess })
test.pushBefore({ requireDatabase })
test.pushTests({ 
    testGetAllUsers, testGetUser, testGetChats, testGetMessages, 
    testDeleteUser, testDeleteChat, testDeleteMessage,
    testUpdate2fa, testUpdatePassword, testUpdateProfile,
    testSendMessage
})
test.pushAfter({ removeDatabaseFromCache })
test.pushCleanUp({ removeMocks })

module.exports = test
