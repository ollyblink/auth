var request = require('supertest');
var jade = require('jade');
var session = require('supertest-session');
var config = require('../config/config');
var mongoose = require('mongoose');
var http = require('http');
var expect = require('chai').expect;
var Person = require('../models/person');
var Account = require('../models/account');
var security = require('../utils/security/securityhelper');
var functionsToTest = require('../routes/consent');
var should = require('should');
var fs = require("fs");


/**
 * Todo: add more tests (especially error provoking ones...)
 */
describe('Grant Data Access', function () {

    var server;
    var testSession = null;

    beforeEach(function () {
        delete require.cache[require.resolve('../app')]; //needed to have a clear server with every unit test
        config.db.prod = "mongodb://localhost/consent_routes_tests"; // i do this to change the db. not so nice i know
        var app = require('../app');
        server = http.createServer(app);
        server.listen(3000);

        testSession = session(app);

    });
    afterEach(function (done) {
        server.close(done);
    });
    it('should show all the possible users to grant access to, without oneself', function (done) {
        testSession.post('/login')
            .send({username: 'u1', password: "u1"})
            .expect(200)
            .end(function (err, res) {
                testSession
                    .get('/consents/possibleconsents')
                    .expect(200)
                    .end(function (err, res) {
                        expect(res.body.success).to.equal(true);
                        expect(res.body.user).to.equal('u1');
                        expect(res.body.authorisableUsers).to.not.contain('u1');
                        expect(res.body.authorisableUsers).to.not.contain('u2');
                        expect(res.body.authorisableUsers).to.not.contain('u3');
                        expect(res.body.authorisableUsers).to.not.contain('u4');
                        expect(res.body.authorisableUsers).to.not.contain('u5');
                        expect(res.body.authorisableUsers).to.not.contain('u6');
                        expect(res.body.authorisableUsers).to.contain('u7');
                        expect(res.body.authorisableUsers).to.contain('u8');
                        expect(res.body.authorisableUsers).to.contain('u9');
                        expect(res.body.authorisableUsers).to.contain('u10');
                        done();
                    });
            });

    });
    it('should show all the users that have access to my data', function (done) {
        testSession.post('/login')
            .send({username: 'u1', password: "u1"})
            .expect(200)
            .end(function (err, res) {
                testSession
                    .get('/consents/sentconsents')
                    .expect(200)
                    .end(function (err, res) {
                        expect(res.body.success).to.equal(true);
                        expect(res.body.user).to.equal('u1');
                        expect(res.body.consentedUsers).to.not.contain('u1');
                        expect(res.body.consentedUsers).to.contain('u2');
                        expect(res.body.consentedUsers).to.contain('u3');
                        expect(res.body.consentedUsers).to.contain('u4');
                        expect(res.body.consentedUsers).to.contain('u5');
                        expect(res.body.consentedUsers).to.contain('u6');
                        expect(res.body.consentedUsers).to.not.contain('u7');
                        expect(res.body.consentedUsers).to.not.contain('u8');
                        expect(res.body.consentedUsers).to.not.contain('u9');
                        expect(res.body.consentedUsers).to.not.contain('u10');
                        done();
                    });
            });

    });
    it('should show all the users this user can view the data from', function (done) {
        testSession.post('/login')
            .send({username: 'u1', password: "u1"})
            .expect(200)
            .end(function (err, res) {
                testSession
                    .get('/consents/receivedconsents')
                    .expect(200)
                    .end(function (err, res) {
                        expect(res.body.success).to.equal(true);
                        expect(res.body.user).to.equal('u1');
                        expect(res.body.consentedUsers).to.not.contain('u1');
                        expect(res.body.consentedUsers).to.contain('u2');
                        expect(res.body.consentedUsers).to.not.contain('u3');
                        expect(res.body.consentedUsers).to.not.contain('u4');
                        expect(res.body.consentedUsers).to.not.contain('u5');
                        expect(res.body.consentedUsers).to.not.contain('u6');
                        expect(res.body.consentedUsers).to.not.contain('u7');
                        expect(res.body.consentedUsers).to.not.contain('u8');
                        expect(res.body.consentedUsers).to.not.contain('u9');
                        expect(res.body.consentedUsers).to.not.contain('u10');
                        done();
                    });
            });

    });
    it('should add and then remove a consent again', function (done) {
        testSession.post('/login')
            .send({username: 'u4', password: "u4"})
            .expect(200)
            .end(function (err, res) {
                testSession
                    .post('/consents/grantdataaccess')
                    .send({receiver: 'u3'})
                    .expect(200)
                    .end(function (err, res) {
                        expect(res.body.success).to.equal(true);
                        expect(res.body.message).to.equal('Successfully saved new consent for user u3');
                        expect(res.body.receiver).to.equal('u3');
                        testSession
                            .delete('/consents/deleteconsent/sender/u4/receiver/u3')
                            .send({receiver: 'u3'})
                            .expect(200)
                            .end(function (err, res) {
                                expect(res.body.success).to.equal(true);
                                expect(res.body.message).to.equal('Successfully removed consent with sender u4 and receiver u3');
                                done();
                            });
                    });

            });
    });
});
