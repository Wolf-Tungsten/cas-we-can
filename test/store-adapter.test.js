const chai = require('chai');
const assert = chai.assert;
const storeAdapter = require('../adapter/store-adapter.js/index.js')
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
        accessToken: 'fake_access_token_1',
        accessTokenExpiresAt: moment().toDate(),
        openId: 'fake_openid_1',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_2',
        urlPath: 'fake_url_path_2',
        urlQuery: 'fake_url_query_2',
        accessToken: 'fake_access_token_2',
        accessTokenExpiresAt: moment().toDate(),
        openId: 'fake_openid_2',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_3',
        urlPath: 'fake_url_path_3',
        urlQuery: 'fake_url_query_3',
        accessToken: 'fake_access_token_2',
        accessTokenExpiresAt: moment().toDate(),
        openId: 'fake_openid_2',
        createdTime: moment().toDate()
    }]
    it('saveSession - 测试保存Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.saveSession(conn, f.session, f.urlPath, f.urlQuery, f.createdTime)
        }
    })
    it('updateSession - 测试更新Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.updateSession(conn, f.session, f.openId, f.accessToken, f.accessTokenExpiresAt)
        }
    })
    it('loadSession - 测试读取Session', async () => {
        for (let f of fakeSessions) {
            let r = await storeAdapter.loadSession(conn, f.session)
            assert.equal(r.urlPath, f.urlPath)
            assert.equal(r.urlQuery, f.urlQuery)
            assert.equal(r.accessToken, f.accessToken)
            assert.equal(r.openId, f.openId)
            assert.equal(moment(r.accessTokenExpiresAt).unix(), moment(f.accessTokenExpiresAt).unix())
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
    it('检查 Session 是否清除成功', async () => {
        for (let f of fakeSessions) {
            let r = await storeAdapter.loadSession(conn, f.session)
            assert.equal(r, null)
        }
    })
    it('关闭数据连接', async () => {
        await storeAdapter.closeConnection(conn)
    })
})