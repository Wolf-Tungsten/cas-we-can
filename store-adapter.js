const oracledb = require('oracledb')
oracledb.autoCommit = true
let connectionPool = null; // Oracle 数据库连接池

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
  } catch (e) {}

  // 创建 OpenId CAS 认证信息 对应表
  try {
    await conn.execute(`
  CREATE TABLE cas_we_openid_cas_info
  (
    openid VARCHAR2(256) NOT NULL,
    appid VARCHAR2(256) NOT NULL,
    cas_info VARCHAR2(4000) NOT NULL,
    CONSTRAINT cas_we_openid_cas_info_pk PRIMARY KEY ( openid ) ENABLE 
  )`)
  } catch (e) {}
  
  // 创建 Session 表
  try{
    await conn.execute(`
  CREATE TABLE cas_we_session
  (
    session_key VARCHAR2(256) NOT NULL,
    url_path VARCHAR2(4000) NOT NULL,
    url_query VARCHAR2(4000) NOT NULL,
    created_time TIMESTAMP NOT NULL,
    CONSTRAINT cas_we_session_pk PRIMARY KEY ( session_key ) ENABLE 
  )`)
  } catch (e) {}
  
  // 创建 Ticket 表
  try {
    await conn.execute(`
  CREATE TABLE cas_we_ticket
  (
    ticket VARCHAR2(40) NOT NULL,
    openid VARCHAR2(256) NOT NULL,
    created_time TIMESTAMP NOT NULL,
    CONSTRAINT cas_we_ticket_pk PRIMARY KEY ( ticket ) ENABLE 
  )`)
  } catch (e) {}
  
}

module.exports = {
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
  async closeConnection(conn) {
    await conn.close();
  },
  async saveAccessToken(conn, appId, token, expiresIn) {

  },
  async loadAccessToken(conn, appId) {
    console.log(conn, appId)
  },
  /**
   * saveSession
   * 保存会话标识信息
   * @param {Connection} conn 数据库连接，由 getConnection 方法提供
   * @param {String} session 会话标识，uuid4生成
   * @param {String} urlPath 待授权应用的 URL 路径
   * @param {String} urlQuery 待授权应用的 URL
   * @param {Date} createdTime 会话创建时间
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
   * loadSession
   * 根据 session 获取 saveSession 方法保存的会话信息
   * @param {Connection} conn 
   * @param {String} session 
   * 
   * 返回格式：{ session, urlPath, urlQuery, createdTime }
   * 若无法根据 session 找到预先保存的会话信息，直接返回 null
   */
  async loadSession(conn, session) {
    // 通过 session 获取对应信息并删除 session 记录
    let record = await conn.execute(`
    SELECT session_key, url_path, url_query, created_time
    FROM cas_we_session
    WHERE session_key = :sessionKey
    `, { sessionKey:session })
    if (record.rows.length > 0) {
      return {
        session: record.rows[0][0],
        urlPath: record.rows[0][1],
        urlQuery: record.rows[0][2],
        createdTime: record.rows[0][3]
      }
    } else {
      return null;
    }
  },
  async clearSession(conn, session) {
    await conn.execute(`
    DELETE FROM cas_we_session
    WHERE session_key = :sessionKey
    `, {sessionKey: session})
  },
  async generateTicket(conn, openId) {
    // 生成 ticket
  },
  async getAndDeleteTicket(conn, ticket) {
    // 通过 ticket 获取对应信息并删除 ticket 记录
  }
}