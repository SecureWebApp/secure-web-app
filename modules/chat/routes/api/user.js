const { Router } = require('express')
const router = Router()

const access = require('../../util/access')
const db = require('../../util/db')

const moduleCache = require(process.modules)
/** @type {import('../../../csrf/types').CSRF} */
const { csrf, validate } = moduleCache.require('csrf')
const { options } = moduleCache.require('authenticate')

const logger = process.logger('chat')

const rmset = new Set()
options.authRevokationListeners.push(session => rmset.delete(session.userId))


router.get('/profile', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasUserAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })
    
    const user = await db.getUser(req.session.userId)
    if (!user)
        return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    res.json({ ...user, csrf: csrf(req, res).jsonToken() })
})

// Admin!!
router.get('/:userId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasAdminAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })

    const user = await db.getUser(req.params.userId, true)
    if (!user)
        return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    res.json({ ...user, csrf: csrf(req, res).jsonToken() })
    
})

// Admin!!
router.delete('/:userId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasAdminAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })
    
    const e = await db.deleteUser(req.params.userId)
    if (e === 1)
        return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    else if (e === 2)
        return res.status(400).json({ error: 'user does not exist', csrf: csrf(req, res).jsonToken() })

    // mark user id as deleted, this invalidates any active sessions of this user id
    rmset.add(req.params.userId)

    return res.json({ csrf: csrf(req, res).jsonToken() })
})


module.exports = router
