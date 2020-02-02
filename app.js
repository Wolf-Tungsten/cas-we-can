const Koa = require('koa')
const koaBody = require('koa-body')
const koaRouter = require('koa-router')

const app = new Koa();
const router = new koaRouter();

router.get('/access-token', require('./route/accessToken').getAccessToken)

app.use(koaBody())
app.use(require('./middleware/config')())
app.use(require('./middleware/store')())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)

