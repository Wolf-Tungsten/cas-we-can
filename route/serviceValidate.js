const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
  async serviceValidate(ctx, next) {
    let t_startTime = +moment()
    const { json } = ctx.request.query
    let { ticket, service } = await casAdapter.pickTicketAndService(ctx.request.query)
    service = decodeURIComponent(service)
    const ticketRecord = await ctx.store.loadTicket(ticket)
    console.log(`[计时]读取ticketRecord：${moment() - t_startTime}`)
    t_startTime = +moment()
    if (!ticketRecord ||
      moment().unix() - moment(ticketRecord.createdTime).unix() > ctx.config.ticketExpiresIn
    ) {
      if (ticketRecord) {
        console.log(ticket, service, ticketRecord, moment().unix() - moment(ticketRecord.createdTime).unix())
        const sessionRecord = await ctx.store.loadSession(ticketRecord.session)
        console.log(`[计时]读取sessionRecord：${moment() - t_startTime}`)
        t_startTime = +moment()
        console.log(sessionRecord)
      } else {
        console.log(`ticket:${ticket}没有ticketRecord`)
      }
      throw 'ticket 无效或已过期'
    }
    const sessionRecord = await ctx.store.loadSession(ticketRecord.session)
    if (!sessionRecord ||
      moment().unix() - moment(sessionRecord.createdTime).unix() > ctx.config.sessionExpiresIn
    ) {
      throw 'session 无效或已过期'
    }
    // 验证 service URL 匹配（忽略参数）
    if (ctx.app.env !== 'development' && sessionRecord.urlPath !== service) {
      throw 'service 不匹配'
    }
    if (ctx.inWechat) {
      const openIdCasRecord = await ctx.store.loadOpenIdCasInfo(ctx.config.wechat.appId, sessionRecord.openid)
      console.log(`[计时]读取openid-cas信息：${moment() - t_startTime}`)
      t_startTime = +moment()
      if (json === '1') {
        ctx.body = {
          in_wechat: true,
          openid: sessionRecord.openid,
          access_token: sessionRecord.accessToken,
          expires_in: moment(sessionRecord.accessTokenExpiresAt).unix() - moment().unix(),
          raw_cas_info: openIdCasRecord.rawCasInfo,
          cas_info: await casAdapter.parseCasInfo(openIdCasRecord.rawCasInfo),
          refresh_token: sessionRecord.refreshToken
        }
      } else {
        ctx.body = openIdCasRecord.rawCasInfo
      }
    } else {
      if (json === '1') {
        ctx.body = {
          in_wechat: false,
          raw_cas_info: sessionRecord.shortPathCasInfo,
          cas_info: await casAdapter.parseCasInfo(sessionRecord.shortPathCasInfo)
        }
      } else {
        ctx.body = sessionRecord.shortPathCasInfo
      }
    }
    // 进行清理
    try {
      await ctx.store.clearTicket(ticket)
      console.log(`[计时]清理ticket：${moment() - t_startTime}`)
      t_startTime = +moment()
      await ctx.store.clearSession(ticketRecord.session)
      console.log(`[计时]清理session：${moment() - t_startTime}`)
      t_startTime = +moment()
    } catch (err) { }
  }
}