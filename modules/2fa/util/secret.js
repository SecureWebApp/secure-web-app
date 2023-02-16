const speakeasy = require('speakeasy')


function generateSecret() {
    return speakeasy.generateSecret({ name: process.env.appName, length: 16 })
}

function verify(secret, token) {
    return speakeasy.totp.verify({ secret, token, encoding: 'base32' })
}


module.exports = { generateSecret, verify }
