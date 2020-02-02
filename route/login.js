module.exports = {
    async login(ctx, next) {
        let gotoUrl = ctx.request.query.goto
        let accessKey = ctx.config.urlPrefixWhitelist
        ctx.body = decodeURIComponent(gotoUrl)
    }
}