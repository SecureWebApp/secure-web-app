const { Router } = require('express')
const router = Router()

const access = require('../util/access')

const moduleCache = require(process.modules)
/** @type {import('../../csrf/types').CSRF} */
const { csrf } = moduleCache.require('csrf')

const logger = process.logger('chat')


router.get('/', (req, res, next) => {
    if (access.hasAdminAccess(req)) {
        logger.debug('Admin: Rendering manage users page')
        csrf(req, res)
        res.render('admin-manage-users')
    } else
        next()
})


module.exports = router