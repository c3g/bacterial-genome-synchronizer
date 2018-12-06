const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const csp = require('express-csp-header')
const session = require('express-session')
const flash = require('connect-flash')
const SQLiteStore = require('connect-sqlite3')(session)
const compression = require('compression')

require('ignore-styles')
require('babel-register')({
  ignore: /node_modules\/(?!react-popper|recharts)/,
  presets: ['env', 'react-app'],
})

const config = require('./config')



const app = express()



/*
 * Setup
 */

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(compression())
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(helmet())
app.use(csp({ policies: {
  directives: {
    'default-src': [csp.SELF, 'https://fonts.googleapis.com']
  }
} }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(flash())
app.use(session({ store: new SQLiteStore({ dir: config.paths.data }), secret: 'ommanipadmehum', resave: true, saveUninitialized: true }))


/*
 * Routes
 */

// app.use('/api/donor', isLoggedIn, require('./routes/donor'))

app.use(require('./routes/index'))

app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    res.json({
      ok: false,
      message: typeof err === 'string' ? err : JSON.stringify(err),
      meta: {
        url: req.originalUrl
      }
    })
    res.end()
    return
  }

  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})


module.exports = app
