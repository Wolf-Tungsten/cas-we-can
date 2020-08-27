const uuid = require('uuid/v4')
const moment = require('moment')
const casAdapter = require('../adapter/cas-adapter')
module.exports = {
    async login(ctx, next) {
        let gotoUrl = ctx.request.query.goto
        if(!gotoUrl){
            gotoUrl = ctx.request.query.service
        }
        if(!gotoUrl){
            throw '未指定授权服务'
        }
        gotoUrl = decodeURIComponent(gotoUrl)
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
        // 确定应用已正确授权，准备发起微信网页授权流程
        // 首先生成 session
        const session = uuid()
        // 保存 session
        await ctx.store.saveSession(session, urlPath, urlQuery, moment().toDate())
        let nextStepUrl
        if(ctx.inWechat){
            // 拼接微信回调URL
            nextStepUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.config.wechat.appId}&redirect_uri=${ctx.config.publicPath}wechat-login-callback&response_type=code&scope=snsapi_base&state=${session}#wechat_redirect`
            // 然后我们 wechatCallback 见👋
        } else {
            // 否则通过 shortPath 短路认证
            // 这时不经过 cas-middle，保持 cas 的完整性
            nextStepUrl = await casAdapter.concateLogoutUrl(`${ctx.config.publicPath}cas-middle/login/${session}`)
        }
        ctx.response.redirect(nextStepUrl)
    }
}