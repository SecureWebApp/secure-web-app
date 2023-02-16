/// Imports

const { promisify } = require("util");
const { Router } = require("express");

const { checkEmail, register } = require("../util/db");
const moduleCache = require(process.modules)

const login = moduleCache.require('login')
const csrfExports = moduleCache.require("csrf");
const { hashing } = moduleCache.require('hashing')

/** @type {import('../module').RegisterHook[]} */
const registerHooks = login.registerHooks
/** @type {import('../../csrf/types').csrf} */
const csrf = csrfExports.csrf;
/** @type {import('../../csrf/types').validate} */
const validate = csrfExports.validate;

const logger = process.logger('login')


/// Definitions

const router = Router();

async function onRegisterSuccess(req, res, account, profile) {
    const result = await register(account, profile)
    if (result) {
        res.redirect('/register')
        return logger.error(`Failed to register user: ${result}`)
    }
    logger.debug(`Successfully registered user with email '${req.session.email}'`)
    res.redirect('/login')
}

function evaluateHooks(_req, _res, _account, _profile, hooks) {
    logger.debug('Evaluating register hooks')
    const callback = (req, res, account, profile, error) => {
        if (error)
            return res.send(error)
        // copy account & profile values
        account && Object.assign(_account, account)
        profile && Object.assign(_profile, profile)
        if (hooks.length) {
            logger.debug(`Hook completed, ${hooks.length - 1} remaining`)
            hooks.shift()(req, res, callback)
        } else
            onRegisterSuccess(req, res, _account, _profile)
    }
    hooks.shift()(_req, _res, callback)
}


// Routing

router.get("/", async (req, res) => {
    if (req.session?.auth) 
        res.redirect("/") 
    else {
        if (!req.session) 
            await promisify(req.session.regenerate).call(req.session);
        csrf(req, res);
        res.render("register")
    }
})

router.post("/", async (req, res) => {
    let e;
    if (e = validate(req, res)) {
        csrf(req, res)
        return res.render("register", { csrfError: e });
    }

    let account = {}, profile = {}
    const body = req.unsafeBody || req.body;

    account.email = req.body.email
    if (await checkEmail(account.email)) {
        profile.userName = req.body.username
        account.passwordHash = await hashing.hash(body.password)
        if (!req.session)
            await promisify(req.session.regenerate).call(req.session)
        req.session.username = profile.userName
        req.session.email = account.email

        if (registerHooks.length)
            evaluateHooks(req, res, account, profile, registerHooks.slice())
        else
            onRegisterSuccess(req, res, account, profile)
    } else {
        logger.verbose(`Failed to register a user at session ${req.sessionID}: Invalid email`)
        csrf(req, res)
        res.render('register', { invalidEmail: true })
    }
})


module.exports = router;
