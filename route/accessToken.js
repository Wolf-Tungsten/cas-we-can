module.exports = {
    async getAccessToken(ctx, next) {
        await ctx.store.loadAccessToken('123', '456')
        ctx.body = 'ok'
    }
}