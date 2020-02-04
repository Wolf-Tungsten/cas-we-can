const oracledb = require('oracledb')
oracledb.autoCommit = true
let connectionPool = null; // Oracle 数据库连接池

/**
 * 示例：使用 Oracle 数据库的持久化方案
 */

// 初始化数据库
async function initTables(conn) {
  // 创建 access_token 表
  try {
    await conn.execute(`
    CREATE TABLE cas_we_access_token
    (
      appid VARCHAR2(256) NOT NULL,
      access_token VARCHAR2(256) NOT NULL, 
      acquired_time TIMESTAMP NOT NULL, 
      expires_in INTEGER NOT NULL, 
      CONSTRAINT cas_we_access_token_pk PRIMARY KEY ( appid ) ENABLE 
    )`)
  } catch (e) { }

  // 创建 OpenId CAS 认证信息 对应表
  try {
    await conn.execute(`
    CREATE TABLE cas_we_openid_cas_info
    (
      openid VARCHAR2(256) NOT NULL,
      appid VARCHAR2(256) NOT NULL,
      cas_info VARCHAR2(4000) NOT NULL,
      CONSTRAINT cas_we_openid_cas_info_pk PRIMARY KEY ( openid, appid ) ENABLE 
    )`)
  } catch (e) { }

  // 创建 Session 表
  try {
    await conn.execute(`
  CREATE TABLE cas_we_session
  (
    session_key VARCHAR2(256) NOT NULL,
    url_path VARCHAR2(4000) NOT NULL,
    url_query VARCHAR2(4000),
    created_time TIMESTAMP NOT NULL,
    access_token VARCHAR2(256),
    access_token_expires_at TIMESTAMP,
    refresh_token VARCHAR2(256),
    openid VARCHAR2(256),
    CONSTRAINT cas_we_session_pk PRIMARY KEY ( session_key ) ENABLE 
  )`)
  } catch (e) { }

  // 创建 Ticket 表
  try {
    await conn.execute(`
    CREATE TABLE cas_we_ticket
    (
      session_key VARCHAR2(40) NOT NULL,
      ticket VARCHAR2(256) NOT NULL,
      created_time TIMESTAMP NOT NULL,
      CONSTRAINT cas_we_ticket_pk PRIMARY KEY ( session_key ) ENABLE 
    )`)
  } catch (e) { }

}

module.exports = {
  /**
   * 获取数据源连接
   * @param {Object} config 由 config.yml 实例化的配置对象
   * 本函数用于创建数据库连接，建议使用连接池
   */
  async getConnection(config) {
    // config 来自于 config.yml
    // 首次建立连接时生成连接池
    if (!connectionPool) {
      connectionPool = await oracledb.createPool({
        ...config.oracle
      })
      const conn = await connectionPool.getConnection()
      try {
        await initTables(conn)
      } finally {
        await conn.close()
      }
    }
    return await connectionPool.getConnection()
  },
  /**
   * 关闭数据库连接
   * @param {Connection} conn 数据库连接
   * 本函数关闭传入的数据库连接
   */
  async closeConnection(conn) {
    await conn.close();
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
    // 先删除过期 access token
    await conn.execute(`DELETE FROM cas_we_access_token WHERE appid = :appId`, { appId })
    // 再插入新的 access token
    await conn.execute(`
    INSERT INTO cas_we_access_token
    (appid, access_token, acquired_time, expires_in)
    VALUES
    (:appId, :accessToken, :acquiredTime, :expiresIn)
    `, { appId, accessToken, acquiredTime, expiresIn })
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
    let record = await conn.execute(`
    SELECT access_token, acquired_time, expires_in
    FROM cas_we_access_token
    WHERE appid = :appId
    `, { appId })
    if (record.rows.length > 0) {
      return {
        accessToken: record.rows[0][0],
        acquiredTime: record.rows[0][1],
        expiresIn: record.rows[0][2]
      }
    } else {
      return null;
    }
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
    await conn.execute(`
    INSERT INTO cas_we_session
    (session_key, url_path, url_query, created_time)
    VALUES
    (:sessionKey, :urlPath, :urlQuery, :createdTime)
    `, { sessionKey: session, urlPath, urlQuery, createdTime })
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
    await conn.execute(`
    UPDATE cas_we_session
    SET access_token = :accessToken, access_token_expires_at =:accessTokenExpiresAt, openid = :openid, refresh_token = :refreshToken
    WHERE session_key = :sessionKey
    `, { sessionKey: session, accessToken, accessTokenExpiresAt, openid, refreshToken })
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
    let record = await conn.execute(`
    SELECT session_key, url_path, url_query, created_time, 
    access_token, access_token_expires_at, openid, refresh_token
    FROM cas_we_session
    WHERE session_key = :sessionKey
    `, { sessionKey: session })
    if (record.rows.length > 0) {
      return {
        session: record.rows[0][0],
        urlPath: record.rows[0][1],
        urlQuery: record.rows[0][2],
        createdTime: record.rows[0][3],
        accessToken: record.rows[0][4],
        accessTokenExpiresAt: record.rows[0][5],
        openid: record.rows[0][6],
        refreshToken: record.rows[0][7]
      }
    } else {
      return null;
    }
  },
  /**
   * 清除会话信息
   * @param {Connection} conn 
   * @param {String} session 
   * 清除保存的会话信息
   */
  async clearSession(conn, session) {
    await conn.execute(`
    DELETE FROM cas_we_session
    WHERE session_key = :sessionKey
    `, { sessionKey: session })
  },
  /**
   * 保存 Ticket 和 Session 的对应关系
   * @param {Connection} conn 
   * @param {Session} session 
   * @param {String} ticket 
   * @param {Date} createdTime 
   */
  async saveTicket(conn, session, ticket, createdTime) {
    await conn.execute(`
    INSERT INTO cas_we_ticket
    (session_key, ticket, created_time)
    VALUES
    (:sessionKey, :ticket, :createdTime)
    `, { sessionKey: session, ticket, createdTime })
  },
  /**
   * 根据 Ticket 获取 Session 及有效期信息
   * @param {Connection} conn 
   * @param {String} ticket 
   */
  async loadTicket(conn, ticket) {
    // 通过 session 获取对应信息并删除 session 记录
    let record = await conn.execute(`
    SELECT session_key, ticket, created_time
    FROM cas_we_ticket
    WHERE ticket = :ticket
    `, { ticket })
    if (record.rows.length > 0) {
      return {
        session: record.rows[0][0],
        ticket: record.rows[0][1],
        createdTime: record.rows[0][2]
      }
    } else {
      return null;
    }
  },
  /**
   * 清除保存的 Ticket 信息
   * @param {Connection} conn 
   * @param {String} ticket 
   */
  async clearTicket(conn, ticket) {
    await conn.execute(`
    DELETE FROM cas_we_ticket
    WHERE ticket = :ticket
    `, { ticket })
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
    await conn.execute(`
    INSERT INTO cas_we_openid_cas_info
    (openid, appid ,cas_info)
    VALUES
    (:openid, :appId, :rawCasInfo)
    `, { openid, appId, rawCasInfo })
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
    let record = await conn.execute(`
    SELECT cas_info
    FROM cas_we_openid_cas_info
    WHERE appid = :appId AND openid = :openid
    `, { appId, openid })
    if (record.rows.length > 0) {
      return {
        rawCasInfo: record.rows[0][0],
      }
    } else {
      return null;
    }
  },
  /**
   * 清除 CAS 认证信息
   * @param {Connection} conn 
   * @param {String} appId 
   * @param {String} openid 
   */
  async clearOpenIdCasInfo(conn, appId, openid) {
    await conn.execute(`
    DELETE FROM cas_we_openid_cas_info
    WHERE openid = :openid AND appid = :appId
    `, { openid, appId })
  }
}