const chai = require('chai');
const assert = chai.assert;
const storeAdapter = require('../adapter/store-adapter.js')
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
        openid: 'fake_openid_1',
        refreshToken: 'fake_refresh_token_1',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_2',
        urlPath: 'fake_url_path_2',
        urlQuery: 'fake_url_query_2',
        accessToken: 'fake_access_token_2',
        accessTokenExpiresAt: moment().toDate(),
        openid: 'fake_openid_2',
        refreshToken: 'fake_refresh_token_2',
        createdTime: moment().toDate()
    }, {
        session: 'fake_session_3',
        urlPath: 'fake_url_path_3',
        urlQuery: 'fake_url_query_3',
        accessToken: 'fake_access_token_3',
        accessTokenExpiresAt: moment().toDate(),
        openid: 'fake_openid_3',
        refreshToken: 'fake_refresh_token_3',
        createdTime: moment().toDate()
    }]
    it('saveSession - 测试保存Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.saveSession(conn, f.session, f.urlPath, f.urlQuery, f.createdTime)
        }
    })
    it('updateSession - 测试更新Session', async () => {
        for (let f of fakeSessions) {
            await storeAdapter.updateSession(conn, f.session, f.openid, f.accessToken, f.accessTokenExpiresAt, f.refreshToken)
        }
    })
    it('loadSession - 测试读取Session', async () => {
        for (let f of fakeSessions) {
            let r = await storeAdapter.loadSession(conn, f.session)
            assert.equal(r.urlPath, f.urlPath)
            assert.equal(r.urlQuery, f.urlQuery)
            assert.equal(r.accessToken, f.accessToken)
            assert.equal(r.openid, f.openid)
            assert.equal(r.refreshToken, f.refreshToken)
            assert.equal(moment(r.accessTokenExpiresAt).unix(), moment(f.accessTokenExpiresAt).unix())
            assert.equal(moment(r.createdTime).unix(), moment(f.createdTime).unix())
        }
        let r = await storeAdapter.loadSession(conn, 'fake_not_exist')
        assert.equal(r, null)
    })
    it('clearSession - 测试清除Session', async () => {
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
    let fakeTickets = [
        {
            ticket: 'fake_ticket_1',
            session: 'fake_session_1',
            createdTime: moment().toDate()
        },{
            ticket: 'fake_ticket_2',
            session: 'fake_session_2',
            createdTime: moment().toDate()
        },{
            ticket: 'fake_ticket_3',
            session: 'fake_session_3',
            createdTime: moment().toDate()
        }
    ]
    it('saveTicket - 测试保存Ticket', async () => {
        for (let f of fakeTickets) {
            await storeAdapter.saveTicket(conn, f.session, f.ticket, f.createdTime)
        }
    })
    it('loadTicket - 测试读取Ticket', async () => {
        for (let f of fakeTickets) {
            let r = await storeAdapter.loadTicket(conn, f.ticket)
            assert.equal(r.session, f.session)
            assert.equal(moment(r.createdTime).unix(), moment(f.createdTime).unix())
        }
        let r = await storeAdapter.loadTicket(conn, 'fake_not_exist')
        assert.equal(r, null)
    })
    it('clearTicket - 测试清除Ticket', async () => {
        for (let f of fakeTickets) {
            await storeAdapter.clearTicket(conn, f.ticket)
        }
    })
    it('检查 Ticket 是否清除成功', async () => {
        for (let f of fakeTickets) {
            let r = await storeAdapter.loadTicket(conn, f.ticket)
            assert.equal(r, null)
        }
    })
    let fakeInfos = [
        {
            openid: 'fake_openid_1',
            appId: 'fake_appId_1',
            rawCasInfo: 'fake_raw_cas_info_1',
            createdTime: moment().toDate()
        },{
            openid: 'fake_openid_2',
            appId: 'fake_appId_2',
            rawCasInfo: 'fake_raw_cas_info_2',
            createdTime: moment().toDate()
        },{
            openid: 'fake_openid_3',
            appId: 'fake_appId_3',
            rawCasInfo: 'fake_raw_cas_info_3',
            createdTime: moment().toDate()
        }
    ]
    it('saveInfo - 测试保存 OpenID 和 CAS 对应信息', async () => {
        for (let f of fakeInfos) {
            await storeAdapter.saveOpenIdCasInfo(conn, f.appId, f.openid, f.rawCasInfo)
        }
    })
    it('loadInfo - 测试读取 OpenID 和 CAS 对应信息', async () => {
        for (let f of fakeInfos) {
            let r = await storeAdapter.loadOpenIdCasInfo(conn, f.appId, f.openid)
            assert.equal(r.rawCasInfo, f.rawCasInfo)
        }
        let r = await storeAdapter.loadOpenIdCasInfo(conn, 'fake_not_exist', 'fake_not_exist')
        assert.equal(r, null)
    })
    it('clearInfo - 测试清除 OpenID 和 CAS 对应信息', async () => {
        for (let f of fakeInfos) {
            await storeAdapter.clearOpenIdCasInfo(conn, f.appId, f.openid)
        }
    })
    it('检查 OpenID 和 CAS 对应信息是否清除成功', async () => {
        for (let f of fakeInfos) {
            let r = await storeAdapter.loadOpenIdCasInfo(conn, f.appId, f.openid)
            assert.equal(r, null)
        }
    })
    it('关闭数据连接', async () => {
        await storeAdapter.closeConnection(conn)
    })
})