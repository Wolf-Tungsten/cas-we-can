
module.exports = function () {
  return async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      console.error(err)
      ctx.status = err.code ? err.code : 400
      ctx.body = {
        success: false,
        errcode: err.code ? err.code : 400,
        errmsg: err.message ? err.message : err
      }
    }
  }
}