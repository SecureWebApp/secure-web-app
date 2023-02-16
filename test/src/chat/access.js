const $ = require('assert')
const { join } = require('path')

const Test = require('../../shared/testClass')

const toTest = join(process.projectRoot, 'modules', 'chat', 'util', 'access.js')
let out = {}

// Init

function mockLogger() {
    process.logger = () => ({ verbose: () => {} })
}

function mockEnv() {
    process.env.adminUsers = '1,2'
}


// Before

function requireAccess() {
    out = require(toTest)
}


// Test

function testHasUserAccess() {
    const req = mockRequest(12)

    $(out.hasUserAccess(req) === false, 'User access should be false if not authenticated')
    
    req.session.auth = true
    $(out.hasUserAccess(req) === true, 'User access should be true if authenticated')
    
    req.session.userId = 1
    $(out.hasUserAccess(req) === true, 'User access should be true if admin and authenticated')
}

function testHasAdminAccess() {
    // construct unauth. request with user access
    const req = mockRequest(12)

    $(out.hasAdminAccess(req) === false, 'Admin access should be false if not authenticated [1]')

    req.session.auth = true
    $(out.hasAdminAccess(req) === false, 'Admin access should be false if userId is not in process.env.adminUsers')

    req.session.userId = 1
    req.session.auth = false
    $(out.hasAdminAccess(req) === false, 'Admin access should be false if not authenticated [2]')

    req.session.auth = true
    $(out.hasAdminAccess(req) === true, 'Admin access should be true if authenticated and userId in process.env.adminUsers')
    $(out.hasUserAccess(req) === true, 'User access should be true if admin access is true')
}


// After

function removeAccessFromCache() {
    delete require.cache[toTest]
    out = {}
}


// Clean up

function removeMocks() {
    delete process.logger
    delete process.env.adminUsers
}


// Util

function mockRequest(userId) {
    return { session: { auth: false, userId } }
}


const test = new Test(__filename)
test.pushInit({ mockLogger, mockEnv })
test.pushBefore({ requireAccess })
test.pushTests({ testHasUserAccess, testHasAdminAccess })
test.pushAfter({ removeAccessFromCache })
test.pushCleanUp({ removeMocks })

module.exports = test
