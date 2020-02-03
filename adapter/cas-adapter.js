module.exports = {
  concateLogoutUrl(urlAfterLogout) {
    return `https://newids.seu.edu.cn/authserver/logout?goto=${urlAfterLogin}`
  },
  concateLoginUrl(urlAfterLogin){
    return `https://newids.seu.edu.cn/authserver/login?goto=${urlAfterLogin}`
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