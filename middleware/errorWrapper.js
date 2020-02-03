
module.exports = function () {
    return async (ctx, next) => {
        try {
            await next()
        } catch (err) {
            ctx.status = err.code ? err.code : 400
            ctx.body = {
                success:false,
                code: err.code ? err.code : 400,
                errmsg: err.message ? err.message : err
            }
        }
    }
}