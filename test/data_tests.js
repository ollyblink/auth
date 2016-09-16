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


describe('Data', function () {

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
    /**
     * Todo: add more tests (especially error provoking ones...)
     */
    describe('Get Data', function () {
        it('should NOT be possible to retrieve the data for oneself if not logged in', function (done) {
            testSession
                .get('/data/showdata/username/u1')
                .expect(403)
                .end(function (err, res) {
                    expect(res.body.message).to.equal("Unauthorized");
                    done();
                });

        });
        it('should be possible to retrieve the data for oneself if logged in', function (done) {
            testSession.post('/login')
                .send({username: 'u1', password: "u1"})
                .expect(200)
                .end(function (err, res) {
                    testSession
                        .get('/data/showdata/username/u1')
                        .expect(200)
                        .end(function (err, res) {
                            expect(res.body.success).to.equal(true);
                            expect(res.body.user).to.equal('u1');
                            expect(res.body.spirometryData.length).to.equal(5)
                            done();
                        });
                });
        });

        it('should be possible to retrieve the data for a user one has a consent for if logged in', function (done) {
            testSession.post('/login')
                .send({username: 'u1', password: "u1"})
                .expect(200)
                .end(function (err, res) {
                    testSession
                        .get('/data/showdata/username/u2')
                        .expect(200)
                        .end(function (err, res) {
                            expect(res.body.success).to.equal(true);
                            expect(res.body.user).to.equal('u2');
                            expect(res.body.spirometryData.length).to.equal(5);
                            done();
                        });
                });

        });
        it('should NOT be possible to retrieve the data for a user one has a NO consent for if logged in', function (done) {
            testSession.post('/login')
                .send({username: 'u1', password: "u1"})
                .expect(200)
                .end(function (err, res) {
                    testSession
                        .get('/data/showdata/username/u3')
                        .expect(404)
                        .end(function (err, res) {
                            expect(res.body.success).to.equal(false);
                            expect(res.body.message).to.equal('Could not find matching consent for user u3');
                            done();
                        });
                });

        });
    });

    describe('Post and delete data', function () {
        it('should be possible to create an store a new data item and then to delete it again', function (done) {
            testSession.post('/login')
                .send({username: 'u1', password: "u1"})
                .expect(200)
                .end(function (err, res) {
                    testSession
                        .post('/data/spirometrydataitem')
                        .send({
                            title: "data_test",
                            fvc: 100,
                            fev1: 200
                        })
                        .expect(201)
                        .end(function (err, res) {
                            expect(res.body.success).to.equal(true);
                            expect(res.body.message).to.equal("Successfully stored item with title data_test");
                            testSession
                                .delete("/data/deletedata/user/u1/item/data_test")
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(res.body.message);
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Successfully removed data item with title [data_test] for user u1");
                                    done();
                                });
                        });
                });

        });
    });
});