const uuid = require('uuid/v4')
const axios = require('axios')
const moment = require('moment')

const casAdapter = require('../adapter/cas-adapter')

module.exports = {
  async serviceValidate(ctx, next) {
    const { json } = ctx.request.query
    const { ticket, service } = casAdapter.pickTicketAndService(ctx.request.query)
    const ticketRecord = await ctx.store.loadTicket(ticket)
    if (!ticketRecord ||
      moment().unix() - moment(ticketRecord.createdTime).unix() > ctx.config.ticketExpiresIn
    ) {
      throw 'ticket 无效或已过期'
    }
    const sessionRecord = await ctx.store.loadSession(ticketRecord.session)
    if (!ticketRecord ||
      moment().unix() - moment(sessionRecord.createdTime).unix() > ctx.config.sessionExpiresIn
    ) {
      throw 'session 无效或已过期'
    }
    // 验证 service URL 匹配（忽略参数）
    if (sessionRecord.urlPath !== service) {
      throw 'service 不匹配'
    }
    const openIdCasRecord = await ctx.store.loadOpenIdCasInfo(ctx.config.wechat.appId, sessionRecord.openid)
    if (json) {
      ctx.body = {
        openid: openIdCasRecord.openid,
        access_token: openIdCasRecord.accessToken,
        expires_in: moment(openIdCasRecord.accessTokenExpiresAt).unix() - moment().unix(),
        raw_cas_info: sessionRecord.rawCasInfo,
        cas_info: await casAdapter.parseCasInfo(sessionRecord.rawCasInfo)
      }
    } else {
      ctx.body = sessionRecord.rawCasInfo
    }
    // 进行清理
    try {
      await ctx.store.clearTicket(ticket)
      await ctx.store.clearSession(ticketRecord.session)
    } catch (err) { }
  }
}