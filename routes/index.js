const fs = require('fs')
const path = require('path')
const url = require('url')
const express = require('express')
const router = express.Router()
const React = require('react')
const { renderToString } = require('react-dom/server')
const { Provider } = require('react-redux')

// const Donor = require('./donor') /* requiring ./routes/donor.js, not ./models/donor.js */

const configureStore = require('../client/dist/store').default
const App = require('../client/dist/components/App').default

// Load index.html template
const indexHTML = fs.readFileSync(path.join(__dirname, '../public/index.html')).toString()


// Render index.html
router.use('/', (req, res, next) => {
  const pathname = url.parse(req.url).pathname
  const isIndex = pathname === '/' || pathname === '/index.html'

  if (!isIndex)
    return next()

  const store = configureStore()

  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>,
  )

  const pageHTML = indexHTML
    .replace('"{{SSR_JSON}}"', JSON.stringify(store.getState()))
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)

  res.send(pageHTML)
  res.end()
})

module.exports = router;
