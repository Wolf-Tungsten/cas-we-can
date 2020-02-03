const chai = require('chai');
const assert = chai.assert;
const storeAdapter = require('../store-adapter.js')
const moment = require('moment')
const yaml = require('js-yaml');
const fs = require('fs');

const config = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'))

describe('StoreAdapter 测试', function () {
    let conn
    it('创建数据连接', async () => {
        conn = await storeAdapter.getConnection(config)
    })
    let fakeSessions = [{
        session: 'fake_session_1',
        urlPath: 'fake_url_path_1',
        urlQuery: 'fake_url_query_1',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_2',
        urlPath: 'fake_url_path_2',
        urlQuery: 'fake_url_query_2',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_3',
        urlPath: 'fake_url_path_3',
        urlQuery: 'fake_url_query_3',
        createdTime: moment().toDate()
    }]
    it('saveSession - 测试保存Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.saveSession(conn, f.session, f.urlPath, f.urlQuery, f.createdTime)
        }
    })
    it('loadSession - 测试读取Session', async () => {
        for (let f of fakeSessions) {
            let r = await storeAdapter.loadSession(conn, f.session)
            assert.equal(r.urlPath, f.urlPath)
            assert.equal(r.urlQuery, f.urlQuery)
            assert.equal(moment(r.createdTime).unix(), moment(f.createdTime).unix())
        }
        let r = await storeAdapter.loadSession(conn, 'fake_not_exist')
        assert.equal(r, null)
    })
    it('clearSession - 测试删除Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.clearSession(conn, f.session)
        }
    })
    it('检查 Session 是否清楚成功', async () => {
        for (let f of fakeSessions) {
            let r = await storeAdapter.loadSession(conn, f.session)
            assert.equal(r, null)
        }
    })
    it('关闭数据连接', async () => {
        await storeAdapter.closeConnection(conn)
    })
})