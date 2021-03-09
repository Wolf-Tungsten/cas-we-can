const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
  async wechatLoginCallback(ctx, next) {
    const { code, state: session } = ctx.request.query
    let t_startTime = +moment()
    // 确保 session 有效
    let sessionRecord = await ctx.store.loadSession(session)
    if (!sessionRecord) {
      //throw 'Session 无效'
      ctx.response.redirect(ctx.config.fallbackUrl)
      return
    }
    // console.log(`[计时]读取sessionRecord：${moment() - t_startTime}`)
    t_startTime = +moment()
    // 向微信服务器获取 openid 和 网页授权 accessToken
    let wechatResponse
    try {
      wechatResponse = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${ctx.config.wechat.appId}&secret=${ctx.config.wechat.appSecret}&code=${code}&grant_type=authorization_code`)
    } catch (err) {
      console.log(err)
    }
    // console.log(`[计时]请求微信服务器：${moment() - t_startTime}`)
    t_startTime = +moment()
    wechatResponse = wechatResponse.data
    if (!wechatResponse.openid || !wechatResponse.access_token) {
      // 获取失败，发起重试
      const wechatOAuthUrl =
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.config.wechat.appId}&redirect_uri=${ctx.config.publicPath}wechat-callback&response_type=code&scope=snsapi_base&state=${session}#wechat_redirect`
      ctx.response.redirect(wechatOAuthUrl)
    }
    const accessTokenExpiresAt = moment(+moment() + wechatResponse.expires_in).toDate()
    await ctx.store.updateSession(session, wechatResponse.openid, wechatResponse.access_token, accessTokenExpiresAt, wechatResponse.refresh_token)
    // console.log(`[计时]更新session信息：${moment() - t_startTime}`)
    t_startTime = moment()
    // 查询是否存在用户完整的绑定信息
    let userBindInfo = await ctx.store.loadOpenIdCasInfo(ctx.config.wechat.appId, wechatResponse.openid)
    // console.log(`[计时]读取CAS-INFO：${moment() - t_startTime}`)
    t_startTime = moment()
    if (userBindInfo) {
      // 已有用户绑定信息
      // 生成 ticket
      const ticket = await casAdapter.generateCasTicket()
      // 关联 ticket 和 session 关系
      await ctx.store.saveTicket(session, ticket, moment().toDate())
      // console.log(`[计时]保存ticket：${moment() - t_startTime}`)
      t_startTime = moment()
      // 拼装业务授权回调URL
      const targetUrl = await casAdapter.concateTargetUrl(sessionRecord.urlPath, ticket, sessionRecord.urlQuery)
      ctx.response.redirect(targetUrl)
    } else {
      // 跳转 CAS 认证
      // 为了最大兼容性，直接将 session 拼接在 URL Path 中
      const casCallbackUrl = `${ctx.config.publicPath}cas-middle/login/${session}`
      ctx.response.redirect(await casAdapter.concateLogoutUrl(casCallbackUrl))
    }
  },
  async wechatLogoutCallback(ctx, next) {
    const { code, state: session } = ctx.request.query
    // 确保 session 有效
    let sessionRecord = await ctx.store.loadSession(session)
    if (!sessionRecord) {
      ctx.response.redirect(ctx.config.fallbackUrl)
      return
    }
    // 向微信服务器获取 openid 和 网页授权 accessToken
    let wechatResponse = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${ctx.config.wechat.appId}&secret=${ctx.config.wechat.appSecret}&code=${code}&grant_type=authorization_code`)
    wechatResponse = wechatResponse.data
    if (!wechatResponse.openid || !wechatResponse.access_token) {
      // 获取失败，发起重试
      const wechatOAuthUrl =
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.config.wechat.appId}&redirect_uri=${ctx.config.publicPath}wechat-logout-callback&response_type=code&scope=snsapi_base&state=${session}#wechat_redirect`
      ctx.response.redirect(wechatOAuthUrl)
    }
    const accessTokenExpiresAt = moment(+moment() + wechatResponse.expires_in).toDate()
    await ctx.store.updateSession(session, wechatResponse.openid, wechatResponse.access_token, accessTokenExpiresAt, wechatResponse.refresh_token)

    const casCallbackUrl = `${ctx.config.publicPath}cas-middle/logout/${session}`
    ctx.response.redirect(await casAdapter.concateLogoutUrl(casCallbackUrl))

  }
}