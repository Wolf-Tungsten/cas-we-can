const axios = require('axios')
const moment = require('moment')

module.exports = {
  async getAccessToken(ctx, next) {
    const { appid: casWeAppId, secret: casWeAppSecret } = ctx.request.query
    if (!ctx.config.appIdMap[casWeAppId] ||
      ctx.config.appIdMap[casWeAppId].casWeAppSecret !== casWeAppSecret) {
      throw {
        code: 403,
        message: '访问凭据无效'
      }
    }
    let record = await ctx.store.loadAccessToken(ctx.config.wechat.appId)
    if (!record ||
      (moment(record.acquiredTime).unix() + record.expiresIn) - moment().unix() < 300) {
      // access token 未获取或已过期
      let wechatResponse = await axios.get(` https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${ctx.config.wechat.appId}&secret=${ctx.config.wechat.appSecret}`)
      wechatResponse = wechatResponse.data
      if(wechatResponse.access_token){
        await ctx.store.saveAccessToken(ctx.config.wechat.appId, wechatResponse.access_token, wechatResponse.expires_in, moment().toDate())
      } else {
        throw {
          code: 500,
          message: '与微信服务器通信获取 Access Token 出现错误'
        }
      }
      ctx.body = wechatResponse
    } else {
      // 保存的 Access Token 仍有效
      ctx.body = {
        access_token: record.accessToken, 
        expires_in: record.expiresIn - (moment().unix() - moment(record.acquiredTime).unix())
      }
    }
  }
}