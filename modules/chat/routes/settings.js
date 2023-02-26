const { Router } = require("express");
const router = Router();

const access = require("../util/access");

const moduleCache = require(process.modules);
/** @type {import('../../csrf/types').CSRF} */
const { csrf } = moduleCache.require("csrf");

const logger = process.logger("chat");

router.get("/", (req, res, next) => {
  if (access.hasUserAccess(req)) {
    logger.debug("User: Rendering settings page");
    csrf(req, res);
    res.render("user-settings");
  } else next();
});

module.exports = router;
