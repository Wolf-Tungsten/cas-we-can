const schedule = require('node-schedule')
const storeAdapter = require('../adapter/store-adapter')
const yaml = require('js-yaml');
const fs = require('fs');
const moment = require('moment')

const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))

const job = schedule.scheduleJob('0 0 * * * *',async function(){
  setTimeout(async () => {
    let db = await storeAdapter.getConnection(config)
    try {
      console.log(chalkColored.blue(`ticket 清理开始`))
      await db.execute(`
      DELETE FROM CAS_WE_TICKET 
      WHERE CREATED_TIME < :expires_at
      `,{expires_at:moment(+moment() - config.ticketExpiresIn * 1000).toDate()})
    }catch(err){
      console.log(chalkColored.red(`ticket 清理失败`))
      console.log(err)
    }finally{
      await db.close()
    }
    console.log(chalkColored.green(`ticket 清理结束`))
  }, (Math.random() + 1) * 3 * 1000)
})

