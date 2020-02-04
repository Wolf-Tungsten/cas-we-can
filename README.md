# cas-we-can
微信网页授权/CAS认证一站式解决方案

## 功能介绍
用于将微信网页授权和 CAS 认证连接，引导用户先后完成微信网页授权、CAS 认证登录，
并将用户 OpenId 与 CAS 认证信息关联。
提供 CAS 系统兼容风格接口，以便于各种「古法」开发的系统“无痛”接入。
同时为了便于多子系统接入，提供微信公众号 Access Token 管理服务。

## cas-we 授权登录流程
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
为了保证良好的浏览器兼容性，应首先对URL进行 encodeURIComponent（如果不带参数不encode也行）

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
服务端请求以下接口
```
GET https://example.com/cas-we/serviceValidate?ticket=<st-ticket>&service=<须和登录 URL 中的 goto 参数完全一致>
```
该接口会返回所接入 CAS 系统完全一致的用户信息，方便系统对接。

### 换取 JSON 格式信息
服务端请求以下接口
```
GET https://example.com/cas-we/serviceValidate?ticket=<st-ticket>&service=<须和登录 URL 中的 goto 参数完全一致>&json=1
```

该接口正确返回格式如下：
```json
{
    "success":true,
    "openid":"用户 OpenId",
    "casInfo":{
        "结构化的CAS信息":"由 cas-adapter 转换"
    },
    "rawCasInfo":"原始 CAS 信息"
}
```

## 适配指导
