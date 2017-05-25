"use strict"
import * as express from 'express'
import * as request from 'request'

const router = express.Router()
const BbUser = require('./models/bbuser')
const Course = require('./models/course')
const MODELS: any = {
  users: BbUser,
  courses: Course
}

router.get('/', (req: any, res: any) => {
  res.json({ message: "Hello from aMEBA!" })
})

router.all('/users/:userId?', (req: any, res: any) => {
  if (process.env.NODE_DEBUG) console.log(req.params)
  if (process.env.NODE_DEBUG) {
    console.log(req.params.userId)
    console.log('isMany?:', req.params.userId == undefined ? true : false)
  }
  doApi(req, res, req.params.userId == undefined ? true : false)
})


router.all('/courses/:courseId?', (req: any, res: any) => {
  doApi(req, res, req.params.courseId == undefined ? true : false)
})

router.all('/courses/:courseId/users/:userId?', (req: any, res: any) => {
  doApi(req, res, req.params.userId == undefined ? true : false)
})


function doApi(req: any, res: any, isMany: boolean) {
  if (process.env.NODE_DEBUG) {
    console.log('[ bbapi:req.path   ]\t', req.path)
    console.log('[ bbapi:req.params ]\t', req.params)
    console.log('[ bbapi:req.query  ]\t', req.query)
    console.log('[ bbapi:req.body   ]\t', req.body)
  }

  let params: any = Object.assign({}, req.params)
  let p: string[] = req.path.split('/').slice(1)

  let model: any
  model = MODELS[p[0]]

  // let isMany:boolean = (typeof params != undefined && params[0] != undefined && params != {}) ? false : true
  if (!isMany) {
    for (let key in req.params) {
      let _key = key
      if (key == 'userId') {
        // check for externalId else userName
        if (/^\d+/.test(req.params[key])) {
          _key = 'externalId'
        } else {
          _key = 'userName'
        }
        delete params.userId
      }
      params[_key] = req.params[key].replace(/^(\w+:)/gi, '')
    }
  }

  if (process.env.NODE_DEBUG) console.log(model.name, p, params)

  let docs = model.find(params).exec()
  docs.then((docs: any) => {
    if (process.env.NODE_DEBUG) console.log(docs)
    console.log('should have documents here.....')
    // if no docs then get docs from bb
    console.log(docs.length)
    // if (!docs && docs == []) {
    if (docs.length == 0) {
      // save retrieved to mongo
      console.log('I should be getting the data from Bb here!')
      getDataAndSave(req, res, model, params)
    } else {
      // return docs to client
      console.log('We have some docs...')
      console.log(docs)
      sendJson(res, null, docs)
    }
  })
}

function getDataAndSave(req: any, res: any, model: any, params: any) {
  if (process.env.NODE_DEBUG) console.log('[bbpi.doApi] [document.then()] retrieving document from Bb')
  let url = req.app.locals.bbApiUrl + req.path
  console.log(req.app.locals.bbpayload.access_token)
  if (process.env.NODE_DEBUG) console.log(url)
  request({
    method: req.method,
    url: url,
    headers: {
      "Authorization": `Bearer ${req.app.locals.bbpayload.access_token}`
    },
    qs: req.query,
    form: req.body,
    json: true
  }, (err: any, resp: any, body: any) => {
    // console.log(resp)
    console.log(body)
    // if (body.status != 404) {
    if (body) {
      console.log('docs loaded')
      model.create(body, (err: any, docs: any) => {
        // model.insertMany((err: any, docs: any) => {
        if (err) throw (err)
        sendJson(res, null, docs)
      })
    } else {
      // doc(s) do(es) not exist in Bb
      // pass the result(s) back to the client
      sendJson(res, err, body)
    }
  })
}

function sendJson(res: any, err: any, data: any) {
  if (err || !data) {
    res.status(404).json({ message: 'No records could be found' });
  } else {
    // console.log(data)
    res.status(200).json(data);
  }
}


module.exports = router
