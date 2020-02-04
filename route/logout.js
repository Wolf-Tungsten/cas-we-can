const uuid = require('uuid/v4')
const moment = require('moment')
module.exports = {
    async logout(ctx, next) {
        if(!ctx.config.enableLogout){
            throw {
                message:'系统策略禁止登出',
                code:403
            }
        }
        const gotoUrl = decodeURIComponent(ctx.request.query.goto)
        const [urlPath, urlQuery] = gotoUrl.split('?')
        // 检查应用是否正确授权
        let accessKey
        Object.keys(ctx.config.urlPrefixWhitelist).forEach(url => {
            if(urlPath.startsWith(url)){
                accessKey = ctx.config.urlPrefixWhitelist[url]
            }
        })
        if(!accessKey){
            throw {
                code: 403,
                message: `服务\`${gotoUrl}\`未正确授权`
            }
        }
        // 首先生成 session
        const session = uuid()
        // 保存 session
        await ctx.store.saveSession(session, urlPath, urlQuery, moment().toDate())
        // 拼接微信回调URL
        let wechatOAuthUrl = 
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.config.wechat.appId}&redirect_uri=${ctx.config.publicPath}wechat-logout-callback&response_type=code&scope=snsapi_base&state=${session}#wechat_redirect`
        // 然后我们 wechatCallback 见👋
        ctx.response.redirect(wechatOAuthUrl)
    }
}