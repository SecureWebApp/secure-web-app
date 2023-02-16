const { Router } = require('express')
const router = Router()

const access = require('../../util/access')
const db = require('../../util/db')

const moduleCache = require(process.modules)
/** @type {import('../../../csrf/types').CSRF} */
const { csrf, validate } = moduleCache.require('csrf')

const logger = process.logger('chat')


router.get('/', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    
    if (access.hasAdminAccess(req)) {
        logger.verbose('Received admin request to list all users')
        let users = await db.getAllUsers(true)
        if (!users)
            res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
        else {
            users = users.filter(v => !access.hasAdminAccessById(v.userId))
            res.json({ array: users, csrf: csrf(req, res).jsonToken() })
        }
    } else if (access.hasUserAccess(req)) {
        logger.debug('Received user request to list all users')
        let users = await db.getAllUsers()
        if (!users)
            res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
        else {
            users = users.filter(v => !access.hasAdminAccessById(v.userId))
            res.json({ array: users, csrf: csrf(req, res).jsonToken() })
        }
    } else
        res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })
})


module.exports = router
