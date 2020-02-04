const axios = require('axios')
const xmlparser = require('fast-xml-parser')
const uuid = require('uuid/v4')

module.exports = {
  async concateLogoutUrl(urlAfterLogout) {
    return `https://newids.seu.edu.cn/authserver/logout?goto=${urlAfterLogout}`
  },
  async concateLoginUrl(urlAfterLogin){
    return `https://newids.seu.edu.cn/authserver/login?goto=${urlAfterLogin}`
  },
  async concateTargetUrl(urlPath, ticket, urlQuery){
    return `${urlPath}?ticket=${ticket}&${urlQuery ? urlQuery : ''}`
  },
  async pickTicketAndService(query){
    return { 
      ticket: query.ticket,
      service: query.service
    }
  },
  /**
   * 从 CAS 系统读取用户信息的适配器
   * @param {Map<String, String>} query 从 CAS 系统返回时所携带的 Query 参数，从中获取ST-Ticket
   * @param {String} service 访问 CAS 系统使用的 service
   * 
   * 若获取成功则直接返回「原始」的 body
   * 若获取失败则返回 null 或空串
   */
  async fetchCasInfo(query, service){
    // 处理返回系统的url，并通过 CAS 的 serviceValidate 获取用户信息
    // 若出错，请返回 null
    let casResponse = await axios.get(
      `https://newids.seu.edu.cn/authserver/serviceValidate?ticket=${query.ticket}&service=${service}`
      )
    // 此处对返回结果做正确性验证
    if(xmlparser.parse(casResponse.data)['cas:serviceResponse']['cas:authenticationSuccess']){
      return casResponse.data
    } else {
      return null
    }
  },
  async parseCasInfo(rawCasInfo){
    // 解析 CAS 返回的用户信息
    // 该函数的返回结构化的 cas 信息
    const data = xmlparser.parse(rawCasInfo)['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']
    const cardnum = ''+data['cas:uid']
    const name = data['cas:cn']
    return { cardnum, name }
  },
  async generateCasTicket(){
    // 生成符合目标 CAS 系统规则的 Ticket
    return `ST-${uuid().split('-').join('')}-cas`
  },
}