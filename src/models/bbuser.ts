import crypto = require('crypto')

const mongoose = require('mongoose')
const fieldsAliasPlugin = require('mongoose-aliasfield')
const Schema = mongoose.Schema

/**
 * User Schema
 */

let BbUserSchema = new Schema({
  id: { type: String, alias: 'userId' },
  uuid: String,
  externalId: String,
  dataSourceId: String,
  userName: { type: String },
  educationLevel: String,
  gender: String,
  created: String,
  lastLogin: String,
  systemRoleIds: [],
  availability: {
    available: String
  },
  name: {
    given: String,
    family: String,
    title: String
  },
  contact: {
    email: String
  }
})

let handleE11000 = function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error);
  }
}

BbUserSchema.post('save', handleE11000);
BbUserSchema.post('update', handleE11000);
BbUserSchema.post('findOneAndUpdate', handleE11000);
BbUserSchema.post('insertMany', handleE11000);


BbUserSchema.plugin(fieldsAliasPlugin)
BbUserSchema.set('timestamps', true)

const default_select = 'id uuid externalId userName name email'

/**
 * Virtuals
 */

BbUserSchema
  .virtual('password')
  .set((password: string) => {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(() => {
    return this._password
  })

BbUserSchema.set('toJSON', {
  transform: function(doc: any, ret: any, options: any) {
    delete ret.password; return ret;
  }
})


BbUserSchema.pre('save', (next: any) => {
  //if (!this.isNew) return next()

  //if (!validatePresenceOf(this.password)) {
  //    next(new Error('Invalid password'))
  //} else {
  next()
  //}
})

/**
 * Methods
 */

BbUserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: (plainText: string) => {
    // coming from LDAP, if we get here, we are already authenticated
    // TODO: remove when confirmed
    return true
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function() {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: (password: string) => {
    if (!password) return ''
    try {
      //noinspection JSUnresolvedVariable
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex')
    } catch (err) {
      return ''
    }
  }
}

/**
 * Statics
 */

BbUserSchema.statics = {

  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function(options: any, cb: any) {
    let criteria = options.criteria || {}
    let select = options.select || default_select
    let isPrimaryId: boolean
    try {
      console.log('[BbUser.load() [options.criteria]', criteria)
      isPrimaryId = /^_\d+_1/.test(criteria.userId)
    } catch (ex) {
      console.log(ex)
      isPrimaryId = false
    } finally {
      console.log(isPrimaryId)
    }
    let _criteria: any = {}
    if (!isPrimaryId) {
      for (let key in criteria) {
        if (key == 'userId') {
          // check for externalId else userName
          if (/^\d+/.test(criteria.userId)) {
            _criteria.externalId = criteria.userId
          } else {
            _criteria.userName = criteria.userId
          }
        } else {
          _criteria[key] = criteria[key]
        }
      }
    } else {
      _criteria = Object.assign({}, criteria)
      _criteria.id = criteria.userId
      delete _criteria.userId
    }
    console.log('[BbUser.load()] [_criteria]:', _criteria)
    return this.findOne(_criteria)
      .select(select)
      .exec(cb)
  },
  list: function(options: any, cb: any) {
    var criteria = options.criteria || {}
    var select = options.select || default_select
    var sort = options.sort || 1
    var page = options.page || 0
    var limit = options.limit || 30
    return this.find(criteria)
      .select(select)
      .populate('users', select)
      .sort({ _id: sort })
      .limit(limit)
      .skip(limit * page)
      .exec(cb)
  },
  findOrCreate: function(options: any, cb: any) {
    var criteria = options.criteria || {}
    var select = options.select || default_select
    let isPrimaryId: boolean
    try {
      console.log('[BbUser.load() [options.criteria]', options.criteria)
      isPrimaryId = /^_\d+_1/.test(options.criteria.userId)
    } catch (ex) {
      console.log(ex)
      isPrimaryId = false
    } finally {
      console.log(isPrimaryId)
    }
    let _criteria: any = {}
    if (!isPrimaryId) {
      for (let key in options) {
        if (key == 'userId') {
          _criteria.userName = options.criteria.userId
        } else {
          _criteria[key] = options.criteria[key]
        }
      }
    } else {
      _criteria = Object.assign({}, criteria)
    }
    console.log('[BbUser.findOrCreate()] [_criteria]:', _criteria)
    this.findOne(_criteria, (err: any, user: any) => {
      if (err) throw (err)
      if (user) {
        cb(err, user)
      } else {
        let _user = new this(criteria)
        cb(null, _user.save())
      }
    })
  }
}

module.exports = mongoose.model('BbUser', BbUserSchema, 'bbusers')
