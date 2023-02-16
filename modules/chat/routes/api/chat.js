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
    if (!access.hasUserAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })
    
    const chats = await db.getChats(req.session.userId, access.hasAdminAccess(req))
    if (!chats)
        return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    res.json({ array: chats, csrf: csrf(req, res).jsonToken() })
})

// Admin!!
router.delete('/:chatId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasAdminAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })

    const e = await db.deleteChat(req.params.chatId)
    switch (e) {
        case 0: return res.json({ csrf: csrf(req, res).jsonToken() })
        case 2: return res.status(400).json({ error: 'chat does not exist', csrf: csrf(req, res).jsonToken() })
        default: return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    }
})

router.get('/:chatId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasUserAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })

    const chat = await db.getMessages(req.params.chatId, access.hasAdminAccess(req) ? null : req.session.userId)
    switch (chat) {
        case 1: return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
        case 2: return res.status(400).json({ error: 'chat does not exist', csrf: csrf(req, res).jsonToken() })
        case 3: return res.status(403).json({ error: 'user is not part of this chat', csrf: csrf(req, res).jsonToken() })
        default: return res.json({ array: chat, csrf: csrf(req, res).jsonToken() })
    }
})

router.post('/send/:userId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasUserAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })
    if (!req.body.message)
        return res.status(400).json({ error: 'missing parameters', csrf: csrf(req, res).jsonToken() })
    
    const e = await db.sendMessage(req.session.userId, req.params.userId, req.body.message, new Date())
    switch (e) {
        case 0: return res.json({ csrf: csrf(req, res).jsonToken() })
        case 2: return res.status(400).json({ error: 'sender does not exist', csrf: csrf(req, res).jsonToken() })
        case 3: return res.status(400).json({ error: 'recipient does not exist', csrf: csrf(req, res).jsonToken() })
        default: return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    }
})

router.delete('/:chatId/:msgId', async (req, res) => {
    if (validate(req, res))
        return res.status(400).json({ error: 'csrf', csrf: csrf(req, res).jsonToken() })
    if (!access.hasUserAccess(req))
        return res.status(403).json({ error: 'insufficient permissions', csrf: csrf(req, res).jsonToken() })

    const e = await db.deleteMessage(req.params.chatId, req.params.msgId, access.hasAdminAccess(req) ? null : req.session.userId)
    switch (e) {
        case 0: return res.json({ csrf: csrf(req, res).jsonToken() })
        case 2: return res.status(400).json({ error: 'message does not exist', csrf: csrf(req, res).jsonToken() })
        case 3: return res.status(403).json({ error: 'user is not author of the message', csrf: csrf(req, res).jsonToken() })
        default: return res.status(500).json({ error: 'internal', csrf: csrf(req, res).jsonToken() })
    }
})


module.exports = router
