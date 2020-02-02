const oracledb = require('oracledb')
oracledb.autoCommit = true
let connectionPool = null; // Oracle 数据库连接池

async function initTables(conn) {
  // 创建 access_token 表
  console.log('创建 access_token 表')
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
  } catch (e) { console.log(e) }


  // 创建 OpenId CAS 认证信息 对应表
  console.log('创建 openid_cas_info 表')
  try {
    await conn.execute(`
  CREATE TABLE cas_we_openid_cas_info
  (
    openid VARCHAR2(256) NOT NULL,
    appid VARCHAR2(256) NOT NULL,
    cas_info VARCHAR2(4000) NOT NULL,
    CONSTRAINT cas_we_openid_cas_info_pk PRIMARY KEY ( openid ) ENABLE 
  )`)
  } catch (e) { console.log(e) }
  

  // 创建 Session 表
  console.log('创建 session 表')
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
  } catch (e) { console.log(e) }
  

  // 创建 Ticket 表
  console.log('创建 ticket 表')
  try {
    await conn.execute(`
  CREATE TABLE cas_we_ticket
  (
    ticket VARCHAR2(40) NOT NULL,
    openid VARCHAR2(256) NOT NULL,
    created_time TIMESTAMP NOT NULL,
    CONSTRAINT cas_we_ticket_pk PRIMARY KEY ( ticket ) ENABLE 
  )`)
  } catch (e) { console.log(e) }
  
}

module.exports = {
  async getConnection(config) {
    // config 来自于 config.yml
    // 首次建立连接时生成连接池
    if (!connectionPool) {
      console.log('创建连接池')
      connectionPool = await oracledb.createPool({
        ...config.oracle
      })
      console.log('创建连接池完成')
      const conn = await connectionPool.getConnection()
      console.log('开始初始化')
      try {
        await initTables(conn)
        console.log('初始化完成')
      } finally {
        await conn.close()
      }
    }
    console.log('获取数据库连接')
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
  async generateSession(conn, urlPath, urlQuery) {
    // 生成 session
  },
  async getAndDeleteSession(conn, session) {
    // 通过 session 获取对应信息并删除 session 记录
  },
  async generateTicket(conn, openId) {
    // 生成 ticket
  },
  async getAndDeleteTicket(conn, ticket) {
    // 通过 ticket 获取对应信息并删除 ticket 记录
  }
}