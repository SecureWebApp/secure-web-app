const logger = process.logger('chat')

const admins = process.env.adminUsers.split(',').map(v => parseInt(v.trim()))
logger.verbose(`Chat admins: [${admins.join(', ')}]`)

function hasAdminAccessById(userId) {
    if (admins.some(v => v === userId))
        return true
    return false
}

function hasAdminAccess(req) {
    if (!hasUserAccess(req))
        return false
    return hasAdminAccessById(req.session.userId)
}

function hasUserAccess(req) {
    return req.session?.auth
}


module.exports = { hasAdminAccessById, hasAdminAccess, hasUserAccess }
