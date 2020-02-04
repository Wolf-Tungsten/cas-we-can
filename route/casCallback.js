const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
    async middle(ctx, next) {
        const { action, session } = ctx.params
        let nextUrl
        if(action === 'login'){
            nextUrl = casAdapter.concateLoginUrl(`${ctx.config.publicPath}cas-login-callback/${session}`) 
        } else {
            nextUrl = casAdapter.concateLoginUrl(`${ctx.config.publicPath}cas-logout-callback/${session}`) 
        }
        ctx.response.redirect(nextUrl)
    },
    async casLoginCallback(ctx, next) {
        const { session } = ctx.params
        // 确保 session 有效
        let sessionRecord = await ctx.store.loadSession(session)
        if(!sessionRecord){
            throw 'Session 无效'
        }
        // 获取 CAS 系统用户信息
        let rawCasInfo = await casAdapter.fetchCasInfo(ctx.request.query, 
            `${ctx.config.publicPath}cas-callback/${session}`)
        if(!rawCasInfo){
            // 没有获取到正确的 CAS 信息，重试
            const casCallbackUrl = `${ctx.config.publicPath}cas-callback/${session}`
            ctx.response.redirect(await casAdapter.concateLoginUrl(casCallbackUrl))
        }
        // 将 CAS 信息和 OpenId 关联并存储
        await ctx.store.saveOpenIdCasInfo(ctx.config.wechat.appId, sessionRecord.openid, rawCasInfo)
        // 生成 ticket
        const ticket = await casAdapter.generateCasTicket()
        // 关联 ticket 和 session 关系
        await ctx.store.saveTicket(session, ticket, moment().toDate())
        // 拼装业务授权回调URL
        const targetUrl = await casAdapter.concateTargetUrl(sessionRecord.urlPath, ticket, sessionRecord.urlQuery)
        ctx.response.redirect(targetUrl)
    },
    async casLogoutCallback(ctx, next) {
        const { session } = ctx.params
        // 确保 session 有效
        let sessionRecord = await ctx.store.loadSession(session)
        if(!sessionRecord){
            throw 'Session 无效'
        }
        // 获取 CAS 系统用户信息
        let rawCasInfo = await casAdapter.fetchCasInfo(ctx.request.query, 
            `${ctx.config.publicPath}cas-callback/${session}`)
        if(!rawCasInfo){
            // 没有获取到正确的 CAS 信息，重试
            const casCallbackUrl = `${ctx.config.publicPath}cas-callback/${session}`
            ctx.response.redirect(await casAdapter.concateLoginUrl(casCallbackUrl))
        }
    }
}