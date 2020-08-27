const storeAdapter = require('../adapter/store-adapter')

module.exports = function () {
  return async (ctx, next) => {
    let conn
    try {
      conn = await storeAdapter.getConnection(ctx.config)
    } catch (err) {
      console.log(err)
      console.log('数据库连接出错，进程结束等待自动重启')
      process.exit(-1)
    }
    ctx.store = {};
    ['saveAccessToken', 'loadAccessToken',
      'saveSession', 'loadSession', 'updateSession', 'updateSessionShortPath', 'clearSession',
      'saveTicket', 'loadTicket', 'clearTicket',
      'saveOpenIdCasInfo', 'loadOpenIdCasInfo', 'clearOpenIdCasInfo'
    ].forEach(fn => {
      ctx.store[fn] = async (...args) => {
        return await storeAdapter[fn](conn, ...args)
      }
    })
    try {
      await next()
    } finally {
      await conn.close()
    }
  }
}