/*
 * auth.js
 */

const config = require('../config')

module.exports = {
  isLoggedIn,
  isAdmin,
  hasAPIKey,
  notAuthenticated,
  forbidden
}

function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated())
    return notAuthenticated(res)
  next()
}

function isAdmin(req, res, next) {
  if (!req.isAuthenticated())
    return notAuthenticated(res)
  if (!req.user.isAdmin)
    return forbidden(res)
  next()
}

function hasAPIKey(req, res, next) {
  const authorization = req.get('authorization')
  if (authorization !== `APIKEY ${config.apiKey}`)
    return forbidden(res)
  next()
}

// Helpers

function notAuthenticated(res) {
  res.status(401)
  res.json({ ok: false, message: 'Not authenticated' })
  res.end()
}

function forbidden(res) {
  res.status(403)
  res.json({ ok: false, message: 'Not authorized to access this' })
  res.end()
}
