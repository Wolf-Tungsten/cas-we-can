const uuid = require('uuid/v4');
module.exports = {
    async login(ctx, next) {
        const gotoUrl = decodeURIComponent(ctx.request.query.goto)
        const [urlPath, urlQuery] = gotoUrl.split['?']
        // 检查应用是否正确授权
        let accessKey
        Object.keys(ctx.config.urlPrefixWhitelist).forEach(url => {
            console.log(url)
            if(urlPath.startsWith(url)){
                accessKey = ctx.config.urlPrefixWhitelist[url]
            }
        })
        if(!accessKey){
            throw {
                code: 403,
                message: `服务\`${gotoUrl}\`未正确授权`
            }
        }
        // 确定应用已正确授权，准备发起微信网页授权流程
        // 首先生成 session
        const session = uuid()


        ctx.body = session
    }
}