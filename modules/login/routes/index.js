const { Router } = require('express')
const router = Router()

router.get('/', (req, res, next) => {
    if (req.session?.auth)
        next()
    else
        res.render('index')  
})

module.exports = router
