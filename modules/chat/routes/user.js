const { Router } = require('express')
const router = Router()

const access = require('../util/access')
const db = require('../util/db')

const moduleCache = require(process.modules)
/** @type {import('../../csrf/types').CSRF} */
const { csrf, validate } = moduleCache.require('csrf')

const logger = process.logger('chat')


router.delete('/', async (req, res) => {
    // TODO delete user
    /*let e
    if (e = validate(req, res)) {
        req.session.locals = { csrfError: e }
        res.redirect('/settings')
    }

    if (!req.session.userId) {
        logger.warn('Could not delete user: Failed to resolve userId!')
        return res.status(400).send('Something went wrong while trying to delete your user account, please try again later.')
    }

    logger.debug(`Deleting user ${req.session.userId}`)
    const error = await db.deleteUser(req.session.userId)
    if (error) {
        logger.warn(`Cound not delete user ${req.session.userId}: Internal database error!`)
        return res.status(500).send('Something went wrong while trying to delete your user account, please try again later.')
    }

    // destroy session
    req.session.destroy(() => {
        req.session.regenerate(() => {
            req.session.locals = { accountDeleted: true }
            res.redirect('/')
        })
    })*/
    logger.warn(`Delete user is not yet implemented!`)
    return res.status(500).send('Sorry, this feature is not yet implemented.')
})

router.put('/profile', async (req, res) => {
    // TODO update profile
    /*let e
    if (e = validate(req, res)) {
        req.session.locals = { csrfError: e }
        res.redirect('/settings')
    }

    if (!req.session.userId) {
        logger.warn('Could not update user profile: Failed to resolve userId!')
        return res.status(400).send('Something went wrong while trying to update your user profile, please try again later.')
    }

    const error = await db.updateProfile(req.session.userId, req.body.name, req.body.description, req.body.profilePicture)
    if (error === 3) {
        logger.verbose(`Could not update profile of user ${req.session.userId}: No parameters were passed`)
        return res.render('usersettings', { updatedProfile: false })
    } else if (error) {
        logger.warn(`Cound not update profile of user ${req.session.userId}: Internal database error!`)
        return res.status(500).send('Something went wrong while trying to delete your user account, please try again later.')
    }

    logger.debug(`Updated profile of user ${userId}`)
    res.render('usersettings', { updatedProfile: true })*/

    logger.warn(`Update profile is not yet implemented!`)
    return res.status(500).send('Sorry, this feature is not yet implemented.')
})

router.put('/password', (req, res) => {
    // TODO update password
    /*let e
    if (e = validate(req, res)) {
        req.session.locals = { csrfError: e }
        res.redirect('/settings')
    }

    if (!req.session.userId) {
        logger.warn('Could not update user password: Failed to resolve userId!')
        return res.status(400).send('Something went wrong while trying to update your user profile, please try again later.')
    }*/

    // TODO
    logger.warn(`Change password is not yet implemented!`)
    return res.status(500).send('Sorry, this feature is not yet implemented.')
})

router.put('/2fa', (req, res) => {
    // TODO update 2fa
    logger.warn(`Change 2fa is not yet implemented!`)
    return res.status(500).send('Sorry, this feature is not yet implemented.')
})


module.exports = router
