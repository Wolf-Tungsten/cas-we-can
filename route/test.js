/**
 * 测试路由
 * 
 * 提供接口仿真测试
 */
const axios = require('axios')
const moment = require('moment')
const yaml = require('js-yaml');
const fs   = require('fs');

const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))

console.log(`
[!] 测试路由已启用

现在你可以通过访问：
${config.publicPath}login?goto=${config.publicPath}test/json
测试 JSON 格式返回（获取 OpenID、网页授权 Access Token、CAS 认证信息）

或访问：
${config.publicPath}login?goto=${config.publicPath}test/cas
测试 XML 返回格式 （仅 CAS 认证信息）

若系统策略允许解除绑定，您可以访问
${config.publicPath}logout?goto=${config.publicPath}test
测试注销
`)
module.exports = {
    async test(ctx, next){
        const { ticket } = ctx.request.query
        const { format } = ctx.params
        if(!format){
            ctx.body = '注销成功'
            return
        }
        const json = format === 'json' ? 1 : 0
        const response = await axios.get(
            `http://localhost:${ctx.config.port}/serviceValidate?ticket=${ticket}&json=${json}&service=${config.publicPath}test/${format}`
        )
        ctx.body = response.data
    }
}