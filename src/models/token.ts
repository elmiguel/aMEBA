import * as mongoose from 'mongoose'
const Schema = mongoose.Schema

const TokenSchema = new Schema({
  access_token: String,
  token_type: String,
  expires_in: String
})
TokenSchema.set('timestamps', true)
TokenSchema.set('capped', { size: 1024, max: 1 })

TokenSchema.statics.getToken = function(cb: any) {
  return this.findOne({}, (err: any, token: any) => {
    if (err) throw (err)
    cb(token)
  })
}

TokenSchema.methods.isValid = function(): boolean {
  // console.log(this)
  let createdAt = new Date(this.createdAt)
  // console.log('createAt:', createdAt)
  let expires_in = new Date(createdAt + this.expires_in + '1000').toISOString()
  // console.log('calculated expires_in:', expires_in)
  let now = new Date().toISOString()
  // console.log('now:', now)

  return now <= expires_in
}

module.exports = mongoose.model('Token', TokenSchema, 'tokens')
