# CAS-We-Can
微信网页授权/CAS 认证解决方案/公众号 Access Token 中控服务

## 功能介绍
* 用于将微信网页授权和 CAS 认证组合，引导用户先后完成微信网页授权、CAS 认证登录，并将用户 OpenId 与 CAS 认证信息关联

* 提供 CAS 兼容风格接口，以便于各种「古法」开发的系统“无痛”接入

* 同时为了便于多子系统接入，提供微信公众号 Access Token 管理服务，接口兼容微信公众号接口风格

* 提供 store-adapter、cas-adapter 以适配目标系统

## 部署

### Step 1.编写 `config.yml` 配置文件

复制项目目录下 `config.example.yml` 为 `config.yml`，并参考其中注释进行配置。

### Step 2.编写 Adapter

**adapter/store-adapter.js**

对持久化功能的适配器，请参考注释修改。

项目提供一种支持 Oracle 数据库的 store-adapter。

同时，为了便于理解，提供了使用内存暂存数据的 store-mem-adapter。⚠️ 内存暂存数据会导致应用无法正确

修改完成后使用 `npm run test` 确保所有功能正确实现。

**adapter/cas-adapter.js**

由于不同厂商的 CAS 系统有细微差别，分离 CAS 认证流程关键部分，请参考注释修改。 

随项目提供适配东南大学统一身份认证系统的方案供参考。

### Step 3.启动服务

使用 `npm run start` 命令以生产模式启动，或使用 `npm run dev` 命令进行调试。

### Step 4.考虑性能

公众号业务可能需要频繁使用 Access Token 或进行网页授权，为防止成为性能瓶颈，CAS-We-Can 支持良好的扩展性；你可以同时部署任意数量进程以满足性能需要，然后用任何你喜欢的方式进行负载均衡。

## cas-we-can 授权登录流程

下文均假设 cas-we 服务被部署在 https://example.com/cas-we 路径。

### Step 1.拼接登录 URL
按照如下格式拼接登录 URL：
```
https://example.com/cas-we/login?goto=<待授权服务 URL>
```
例如，待授权的 URL 为 `https://tommy.seu.edu.cn/idsCallback?key1=value1&key2=value2`，则登录 URL 应为：
```
https://example.com/cas-we/login?goto=https%3A%2F%2Ftommy.seu.edu.cn%2FidsCallback%3Fkey1%3Dvalue1%26key2%3Dvalue2
```
支持 URL Query 参数，既有参数会与授权 ticket 参数融合。
为了保证良好的浏览器兼容性，应首先对URL进行 encodeURIComponent

### Step 2.引导用户访问登录URL
引导用户访问登录 URL，系统将完成微信网页授权、CAS 认证登录，然后前往待授权服务URL。

### Step 3.使用 ticket 换取用户信息
当用户完成授权后，会被重定向至待授权 URL，同时待授权URL会携带 ticket 参数。
ticket 参数会与既有 URL 参数融合，但 ticket 参数位置会位于第一个。
沿用 Step 1 中的例子，当完成授权后，用户会被重定向至：
```
https://tommy.seu.edu.cn/idsCallback?ticket=ST-xxxxxx-cas&key1=value1&key2=value2
```
业务服务获取 ticket 后，开始即可换取用户 CAS 信息和 OpenId。
为了保证兼容性，提供两种换取方式，以下分别介绍。

### 换取古法 CAS 信息
服务端请求以下接口：
```
GET https://example.com/cas-we/serviceValidate?ticket=<st-ticket>&service=<service>
```
该接口会返回所接入 CAS 系统完全一致的用户信息，方便系统对接。

`service` 校验不包含 Query 参数。

### 换取 JSON 格式信息
服务端请求以下接口：
```
GET https://example.com/cas-we/serviceValidate?ticket=<st-ticket>&service=<service>&json=1
```

`service` 校验不包含 Query 参数。

该接口正确返回格式如下：

| 参数          | 类型    | 解释                                            |
| ------------- | ------- | ----------------------------------------------- |
| success       | Boolean | 接口是否调用成功                                |
| openid        | String  | 用户 OpenID                                     |
| access_token  | String  | 网页授权 Access Token（不是接口 Access Token）  |
| expires_in    | Number  | 网页授权有效时间                                |
| refresh_token | String  | 网页授权 Refresh Token（不是接口 Access Token） |
| cas_info      | Object  | 由 cas-adapter 转换                             |
| raw_cas_info  | String  | 原始的 CAS 认证信息                             |

返回示例：

```
{
    "success":true,
    "openid":"用户 OpenId",
    "access_token":"网页授权 Access Token（不是接口 Access Token）",
    "expires_in":7200,
    "refresh_token":"网页授权 Refresh Token"
    "cas_info":{
        "结构化的CAS信息":"由 cas-adapter 转换"
    },
    "rawCasInfo":"原始 CAS 信息"
}
```

## Access Token 中控服务

CAS-We-Can 提供了 Access Token 中控服务，请求接口如下：

```
GET https://example.com/cas-we/access-token?appid=<cas-we-can-app-id>&secret=<cas-we-can-app-secret>
```

**⚠️ 注意** 此处的 `appid` 和 `appSecret` **不是** 微信公众号的 `appid` 和 `appSecret` ! 在 `config.yml` 中配置可访问业务时指定。

返回格式：

| 参数         | 类型   | 解释                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| access_token | String | 微信公众号 Access Token                                      |
| expires_in   | Number | access_token 剩余的有效期（秒），注意这个有效期不是固定的 7200，而是随着获取时间动态变化的 |

返回示例：

```json
{
    "access_token": "30_imoBk9VGPR6pQYt2CioQhRxw-tzbezJjiy8kNOvZt37-Z-ipeXyvWUKlHBOCOP0uvJ6__LiFbQV4JT4ysiflu4pvYDK7nuB_G6e3qlzXN0EL3yC6Sda_9gUdccRtFbWdq35l4N2mZ-vv7pPmQMMcACADZZ",
    "expires_in": 4191
}
```

### 实践建议一：Access Token 随用随获取

多个业务共用 Access Token 时，为了避免出现部分应用 Access Token 因刷新不及时而过期，建议均采用随用随获取的方案。即当需要使用 Access Token 时从 CAS-We-Can 服务获取。

### 实践建议二：子业务不持有公众号 AppID 和 AppSecret

为了防止开发者错误操作，建议子业务不持有公众号 AppID 和 AppSecret。**CAS-We-Can 已覆盖全部需要使用 AppID 和 AppSecret 的场景。**