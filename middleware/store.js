const storeAdapter = require('../adapter/store-adapter')

module.exports = function () {
  return async (ctx, next) => {
    let conn = await storeAdapter.getConnection(ctx.config)
    ctx.store = {};
    ['saveAccessToken', 'loadAccessToken',
      'saveSession', 'loadSession', 'updateSession', 'clearSession',
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