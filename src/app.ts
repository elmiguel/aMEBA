"use strict"
import * as express from 'express'
import * as session from 'express-session'
import * as path from 'path'
import * as bodyParser from 'body-parser'
import * as methodOverride from 'method-override'
import * as request from 'request'
import * as mongoStore from 'connect-mongo'
import { mongooseConfig, BbConfig } from './config'
import { setToken } from './middleware/bbrest-api'

mongoStore(session)

const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

mongoose.connection.once('open', () => {
  mongoose.connection.on('error', (err: any) => {
    console.log(err)
  })
})
mongoose.connect(mongooseConfig.database)
// require our models here
const Token = require('./models/token')


// some variable setup
const env = process.env.NODE_ENV || 'development'
const port = process.env.PORT || 3000


process.env.NODE_DEBUG == '*' ? true : false

// Express app creation and configuration
const app = express()
// Do not display: Express JS in the x-powered-by header
app.set('x-powered-by', false)

// Allow trust from proxies and SSL support from your load balancer
// Especially if you are running on NGINX and upstreams
app.enable('trust proxy')

// Add our BbConfig to our app
app.locals.bbApiUrl = BbConfig.url
Token.getToken((token: any) => {
  if (token && token.isValid()) {
    app.locals.bbpayload = token
  } else {
    setToken((token: any) => {
      app.locals.bbpayload = token
    })
  }
})
// setup body-parser and method-override lets express have access to body posts
// and PUT AND PATCH methods.
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride((req: any) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

// mount our api router
app.use('/api', require('./routes'))
app.get('/', (req: any, res: any) => res.redirect('/api'))

// error handling
// development will print stacktrace esle an empty object
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: env === 'development' ? err : {}
  })
})

//now that the app is setup, start the server
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`)
})
