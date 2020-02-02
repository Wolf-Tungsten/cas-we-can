const oracledb = require('oracledb')

let connectionPool = null; // Oracle 数据库连接池

async function initTables(conn) {
  
}

module.exports = {
  async getConnection(config) {
    // config 来自于 config.yml
    // 首次建立连接时生成连接池
    if(!connectionPool){
      connectionPool = await oracledb.createPool({ 
        ...config.oracle
      })
      const conn = await connectionPool.getConnection()
      initTables(conn)
      await conn.close()
    }
    return await connectionPool.getConnection()
  },
  async closeConnection(conn) {
    conn.close();
  },
  async saveAccessToken(conn, appId, token, expiresIn){
  },
  async loadAccessToken(conn, appId){
    console.log(conn, appId)
  },
}