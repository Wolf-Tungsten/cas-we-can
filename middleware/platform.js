module.exports = function () {
  return async (ctx, next) => {
    ctx.inWechat = (ctx.request.headers['user-agent']).toLowerCase().includes('micromessenger')
    await next()
  }
}