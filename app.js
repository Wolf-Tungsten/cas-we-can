const Koa = require('koa')
const koaBody = require('koa-body')
const koaRouter = require('koa-router')

const app = new Koa();
const router = new koaRouter();

router.get('/access-token', require('./route/accessToken').getAccessToken)
router.get('/login', require('./route/login').login)
router.get('/wechat-login-callback', require('./route/wechatCallback').wechatLoginCallback)
router.get('/wechat-logout-callback', require('./route/wechatCallback').wechatLogoutCallback)
router.get('/cas-middle/:action/:session', require('./route/casCallback').middle)
router.get('/cas-login-callback/:session', require('./route/casCallback').casLoginCallback)
router.get('/cas-logout-callback/:session', require('./route/casCallback').casLogoutCallback)
router.get('/serviceValidate', require('./route/serviceValidate').serviceValidate)

app.use(koaBody())
app.use(require('./middleware/config')())
app.use(require('./middleware/store')())
app.use(require('./middleware/errorWrapper')())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)

// process.on('SIGINT', () => {
//     console.log('Received SIGINT.');
//     process.exit(0);
// });
