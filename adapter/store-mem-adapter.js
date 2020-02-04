const oracledb = require('oracledb')
oracledb.autoCommit = true
let connectionPool = null; // Oracle 数据库连接池

/**
 * 示例：使用内存持久化
 * 警告：不可用于生产环境，会下游业务 Access Token 失效
 */
const store = {
  accessToken: {},
  sessionMap: {},
  ticketMap: {},
  openidCasMap: {}
}

module.exports = {
  /**
   * 获取数据源连接
   * @param {Object} config 由 config.yml 实例化的配置对象
   * 本函数用于创建数据库连接，建议使用连接池
   */
  async getConnection(config) {
    // config 来自于 config.yml
    // 此处没有数据库连接，直接返回 store 对象
    return store
  },
  /**
   * 关闭数据库连接
   * @param {Connection} conn 数据库连接
   * 本函数关闭传入的数据库连接
   */
  async closeConnection(conn) {
    return
  },
  /**
   * 保存 Access Token 及有效期信息
   * @param {Connection} conn 数据库连接
   * @param {String} appId 微信公众号 AppID
   * @param {String} accessToken 微信公众号接口 Access Token
   * @param {Number} expiresIn Access Token 有效时间（秒）
   * @param {Date} acquiredTime Access Token 获取时间
   * 以 AppID 为索引存储 Access Token 及其有效期
   * 使用 AppID 作为索引以支持多个CAS-We-Can 服务共享同一数据库
   */
  async saveAccessToken(conn, appId, accessToken, expiresIn, acquiredTime) {
    conn.accessToken[appId] = {
      accessToken, expiresIn, acquiredTime
    }
  },
  /**
   * 读取保存的 Access Token 及其有效期信息
   * @param {Connection} conn 数据库连接
   * @param {String} appId 微信公众号 AppID
   * 以 AppID 为索引检索 Access Token 及其有效期信息
   * 
   * 返回 { accessToken, expiresIn, acquiredTime }
   */
  async loadAccessToken(conn, appId) {
    return conn.accessToken[appId]
  },
  /**
   * 保存会话信息
   * @param {Connection} conn 数据库连接，由 getConnection 方法提供
   * @param {String} session 会话标识，uuid4生成
   * @param {String} urlPath 待授权应用的 URL 路径
   * @param {String} urlQuery 待授权应用的 URL
   * @param {Date} createdTime 会话创建时间
   * 以 Session 标识符为索引存储会话相关信息
   */
  async saveSession(conn, session, urlPath, urlQuery, createdTime) {
    // 保存 session 信息
    conn.sessionMap[session] = { session, urlPath, urlQuery, createdTime }
  },
  /**
   * updateSession
   * 在会话标识信息中添加网页授权信息
   * @param {Connection} conn 
   * @param {String} session 
   * @param {String} openid 
   * @param {String} accessToken 
   * @param {Date} accessTokenExpiresAt
   * @param {refreshToken} refreshToken
   * 以 Session 标识符检索会话信息，并向其中增添网页授权信息
   * 注意此处的 Access Token 为网页授权 Access Token，与接口 Access Token 不同
   */
  async updateSession(conn, session, openid, accessToken, accessTokenExpiresAt, refreshToken) {
    // 更新 session 信息
    conn.sessionMap[session].openid = openid
    conn.sessionMap[session].accessToken = accessToken
    conn.sessionMap[session].accessTokenExpiresAt = accessTokenExpiresAt
    conn.sessionMap[session].refreshToken = refreshToken
  },
  /**
   * 获取会话信息
   * @param {Connection} conn 
   * @param {String} session 
   * 返回 { session, urlPath, urlQuery, createdTime, accessToken, accessTokenExpiresAt, openid, refreshToken }
   * 若无法根据 session 找到预先保存的会话信息，直接返回 null
   */
  async loadSession(conn, session) {
    // 通过 session 获取对应信息并删除 session 记录
    return conn.sessionMap[session]

  },
  /**
   * 清除会话信息
   * @param {Connection} conn 
   * @param {String} session 
   * 清除保存的会话信息
   */
  async clearSession(conn, session) {
    delete conn.sessionMap[session]
  },
  /**
   * 保存 Ticket 和 Session 的对应关系
   * @param {Connection} conn 
   * @param {Session} session 
   * @param {String} ticket 
   * @param {Date} createdTime 
   */
  async saveTicket(conn, session, ticket, createdTime) {
    conn.ticketMap[ticket] = { session, createdTime, ticket }
  },
  /**
   * 根据 Ticket 获取 Session 及有效期信息
   * @param {Connection} conn 
   * @param {String} ticket 
   */
  async loadTicket(conn, ticket) {
    // 通过 session 获取对应信息并删除 session 记录
    return conn.ticketMap[ticket]
  },
  /**
   * 清除保存的 Ticket 信息
   * @param {Connection} conn 
   * @param {String} ticket 
   */
  async clearTicket(conn, ticket) {
    delete conn.ticketMap[ticket]
  },
  /**
   * 保存 CAS 认证信息
   * @param {Connection} conn 
   * @param {String} appId 
   * @param {String} openid 
   * @param {String} rawCasInfo 
   * 以微信公众号 AppID 和 OpenID 为索引保存用户的 CAS 认证信息
   */
  async saveOpenIdCasInfo(conn, appId, openid, rawCasInfo) {
    conn.openidCasMap[appId + openid] = { appId, openid, rawCasInfo }
  },
  /**
   * 读取 CAS 认证信息
   * @param {Connection} conn 
   * @param {String} appId 
   * @param {String} openid 
   * 以微信公众号 AppID 和 OpenID 为检索用户的 CAS 认证信息
   * 返回 { appId, openid, rawCasInfo }
   */
  async loadOpenIdCasInfo(conn, appId, openid) {
    return conn.openidCasMap[appId + openid]
  },
  /**
   * 清除 CAS 认证信息
   * @param {Connection} conn 
   * @param {String} appId 
   * @param {String} openid 
   */
  async clearOpenIdCasInfo(conn, appId, openid) {
    delete conn.openidCasMap[appId + openid]
  }
}