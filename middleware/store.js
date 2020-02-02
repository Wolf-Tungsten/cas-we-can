const storeAdapter = require('../store-adapter')

module.exports = function () {
    return async (ctx, next) => {
        let conn = await storeAdapter.getConnection(ctx.config)
        ctx.store = {}
            ;(['saveAccessToken', 'loadAccessToken']).forEach( fn => {
                console.log(fn)
                ctx.store[fn] = async (...args) => {
                    return await storeAdapter[fn](conn, ...args)
                }
            })
        try {
            await next()
        } finally {
            conn.close()
        }
    }
}