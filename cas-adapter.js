module.exports = {
  async concateLogoutUrl(urlAfterLogout) {
    // `https://cas.example.com/logout?goto=${url}`
  },
  async concateLoginUrl(urlAfterLogin){
    // `https://cas.example.com/login?goto=${url}`
  },
  async fetchCasInfo(url){
    // 处理返回系统的url，并通过 CAS 的 serviceValidate 获取用户信息
    // 若出错，请返回 false
  },
  async parseCasInfo(rawCasInfo){
    // 解析 CAS 返回的用户信息
    // 该函数的返回结果将作为 serviceValidate 接口的 JSON 结果
  }
}