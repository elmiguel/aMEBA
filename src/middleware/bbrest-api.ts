import { BbConfig } from '../config'
const Token = require('../models/token')
const request = require('request')

export const api = (req: any, res: any, next: any) => {
  if (process.env.NODE_DEBUG) {
    console.log('[ bbrest-api:bbApiUrl ]\t', req.app.locals.bbApiUrl)
    console.log('[ bbrest-api:bbconfig ]\t', req.app.locals.bbpayload)
  }
  next()
}

export const setToken = (cb: any) => {
  request(
    {
      method: 'post',
      url: `${BbConfig.url}/oauth2/token`,
      headers: {
        "Authorization": `Basic ${BbConfig.auth}`
      },
      form: {
        grant_type: 'client_credentials'
      },
      json: true
    },
    (err: any, res: any, body: any) => {
      if (err) {
        console.log('Oops!')
        throw (err.message)
      }
      Token.create(body, (err: any, token: any) => {
        if (err) throw (err)
        cb(token)
      })
    }
  )
}
