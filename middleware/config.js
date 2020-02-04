const yaml = require('js-yaml');
const fs = require('fs');

module.exports = function () {
  const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))
  config.urlPrefixWhitelist = {}
  config.appIdMap = {}
  config.accessKey.forEach(k => {
    k.urlPrefixWhitelist.forEach(u => {
      config.urlPrefixWhitelist[u] = k
    })
    config.appIdMap[k.casWeAppId] = k
  })
  return async (ctx, next) => {
    ctx.config = config
    if (ctx.app.env === 'development') {
      ctx.config.urlPrefixWhitelist[config.publicPath] = 'test'
    }
    await next()
  }
}