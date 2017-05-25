"use strict"
export const mongooseConfig: any = {
  database: 'mongodb://localhost:27017/aMEBA'
}


export const BbConfig = {
  key: '<YOUR_APP_KEY>',
  secret: '<YOUR_APP_SECRET>',
  credentials: 'client_credentials',
  cert_path: './trusted/keytool_crt.pem',
  url: 'https://<YOUR_BB_INSTANCE>/learn/api/public/v1',
  auth: ''
}

BbConfig.auth = new Buffer(BbConfig.key + ":" + BbConfig.secret).toString("base64")
