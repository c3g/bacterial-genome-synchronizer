const express = require('express')
const router = express.Router()

const User = require('../models/user')
const TwoFA = require('../helpers/2fa-manager')
const { okHandler, dataHandler } = require('../helpers/handlers')
const passport = require('../passport')

// POST pass login request to passport
router.post('/login', (req, res, next) => {
  passport.authenticate('local-login', (err, user, info) => {
    if (err)
      return next(err)

    if (user === false) {
      res.json({ ok: false, message: info })
      res.end()
      return
    }

    // Manually establish the session...
    req.login(user, (err) => {
      if (err)
        return next(err)

      return res.json({ ok: true, data: user })
    })

  })(req, res, next)
})

// POST logout
router.use('/logout', (req, res) => {
  req.logout()
  okHandler(res)()
})

// GET check if user is logged in
router.use('/is-logged-in', (req, res) => {
  dataHandler(res)(req.isAuthenticated() ? req.user : false)
})

// POST logout
router.post('/send-code', (req, res) => {
  User.findByEmail(req.body.email)
  .then(TwoFA.sendCode)
  .then(okHandler(res))
  .catch(errorHandler(res))
})

module.exports = router;
