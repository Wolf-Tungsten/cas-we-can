const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
  async serviceValidate(ctx, next) {
    const { json } = ctx.request.query
    let { ticket, service } = await casAdapter.pickTicketAndService(ctx.request.query)
    service = decodeURIComponent(service)
    const ticketRecord = await ctx.store.loadTicket(ticket)
    if (!ticketRecord ||
      moment().unix() - moment(ticketRecord.createdTime).unix() > ctx.config.ticketExpiresIn
    ) {
      console.log(ticket, service, ticketRecord, moment().unix() - moment(ticketRecord.createdTime).unix())
      const sessionRecord = await ctx.store.loadSession(ticketRecord.session)
      console.log(sessionRecord)
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
    const openIdCasRecord = await ctx.store.loadOpenIdCasInfo(ctx.config.wechat.appId, sessionRecord.openid)
    if (json === '1') {
      ctx.body = {
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
    // 进行清理
    try {
      await ctx.store.clearTicket(ticket)
      await ctx.store.clearSession(ticketRecord.session)
    } catch (err) { }
  }
}