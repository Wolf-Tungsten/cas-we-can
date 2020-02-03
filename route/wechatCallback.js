const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
    async wechatCallback(ctx, next) {
        const { code, state:session } = ctx.request.query
        // 确保 session 有效
        let sessionRecord = await ctx.store.loadSession(session)
        if(!sessionRecord){
            throw 'Session 无效'
        }
        // 向微信服务器获取 openid 和 网页授权 accessToken
        let wechatResponse = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${ctx.config.wechat.appId}&secret=${ctx.config.wechat.appSecret}&code=${code}&grant_type=authorization_code`)
        wechatResponse = wechatResponse.data
        if(wechatResponse.openid && wechatResponse.access_token){
            const accessTokenExpiresAt = moment(moment().unix() + wechatResponse.expires_in).toDate()
            await ctx.store.updateSession(session, wechatResponse.openid, wechatResponse.access_token, accessTokenExpiresAt)
            // 跳转 CAS 认证
            // 为了最大兼容性，直接将 session 拼接在 URL Path 中
            const casCallbackUrl = `${ctx.config.publicPath}cas-callback/${session}`
            ctx.response.redirect(casAdapter.concateLoginUrl(casCallbackUrl))
        } else {
            // 获取失败，发起重试
            const wechatOAuthUrl = 
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.config.wechat.appId}&redirect_uri=${ctx.config.publicPath}wechat-callback&response_type=code&scope=snsapi_base&state=${session}#wechat_redirect`
            ctx.response.redirect(wechatOAuthUrl)
        }
    }
}