import crypto = require('crypto')

const mongoose = require('mongoose')
const Schema = mongoose.Schema

/**
 * User Schema
 */

let CourseSchema = new Schema(
  {
    id: String,
    uuid: String,
    externalId: String,
    dataSourceId: String,
    courseId: String,
    name: String,
    created: Date,
    organization: Boolean,
    ultraStatus: String,
    allowGuests: Boolean,
    readOnly: Boolean,
    availability: {
      available: String,
      duration: {
        type: { type: String }
      }
    },
    enrollment: {
      type: { type: String }
    },
    locale: {
      force: Boolean
    }
  })
CourseSchema.set('timestamps', true)

const default_select = 'id uuid externalId courseId courseName organization availability'


/**
 * Statics
 */

CourseSchema.statics = {

  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function(options: any, cb: any) {
    var select = options.select || default_select
    console.log('[Course.load()] [criteria]:', options.criteria)
    return this.findOne(options.criteria)
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
    this.findOne(options.criteria, (err: any, user: any) => {
      if (err) throw (err)
      if (user) {
        cb(err, user)
      } else {
        let _user = new this(criteria)
        cb(_user.save())
      }
    })
  }
}

module.exports = mongoose.model('Course', CourseSchema, 'courses')
