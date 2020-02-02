const yaml = require('js-yaml');
const fs   = require('fs');

module.exports = function () {
    const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))
    config.urlPrefixWhitelist = {}
    config.accessKey.forEach(k => {
        k.urlPrefixWhitelist.forEach(u => {
            config.urlPrefixWhitelist[u] = k
        })
    })
    return async (ctx, next) => {
        ctx.config = config
        await next()
    }
}