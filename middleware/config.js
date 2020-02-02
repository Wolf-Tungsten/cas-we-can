const yaml = require('js-yaml');
const fs   = require('fs');

module.exports = function () {
    const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))
    console.log(config)
    return async (ctx, next) => {
        ctx.config = config
        await next()
    }
}