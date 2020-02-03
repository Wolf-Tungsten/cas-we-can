const storeAdapter = require('../store-adapter')

module.exports = function () {
    return async (ctx, next) => {
        let conn = await storeAdapter.getConnection(ctx.config)
        ctx.store = {};
        ['saveAccessToken', 'loadAccessToken',
        'saveSession', 'loadSession'
    ].forEach(fn => {
                console.log(fn)
                ctx.store[fn] = async (...args) => {
                    return await storeAdapter[fn](conn, ...args)
                }
            })
        try {
            await next()
        } finally {
            console.log('关闭数据库连接')
            await conn.close()
        }
    }
}