module.exports = function () {
  return async (ctx, next) => {
    console.log(ctx.request.headers['user-agent'].toLowerCase())
    ctx.inWechat = (ctx.request.headers['user-agent']).toLowerCase().includes('micromessenger')
    await next()
  }
}