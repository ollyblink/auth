var request = require('supertest');
var jade = require('jade');
var session = require('supertest-session');
var config = require('../config/config');
var mongoose = require('mongoose');
var http = require('http');
var expect = require('chai').expect;
var should = require('should');
var Person = require('../models/person');
var Account = require('../models/account');
var security = require('./securityhelper');
var functionsToTest = require('../routes/consent');

var server;
var testSession;
beforeEach(function () {
    delete require.cache[require.resolve('../app')]; //needed to have a clear server with every unit test
    config.db.production = "mongodb://localhost/consent_routes_tests"; // i do this to change the db. not so nice i know
    clearDB();
    var app = require('../app');
    server = http.createServer(app);
    server.listen(3000);

    testSession = session(app);
});
afterEach(function (done) {
    server.close(done);
});
function clearDB() {
    for (var i in mongoose.connection.collections) {
        mongoose.connection.collections[i].remove(function () {
        });
    }
}

describe('Grant Data Access', function () {
    it('should show all the possible users to grant access to, without oneself', function (done) {
        //Add some users

        this.timeout(50000); //may take time to create the PKI
        var counter = 0;
        for (var i = 0; i < 2; ++i) {
            console.log(i);
            Account.register(new Account({username: "u" + i}), "u" + i, function (err, account) {
                if (err) {
                    console.log("Error while registering user.", err);
                }
                counter++;
                console.log(counter);
                if (counter == 2) {
                    var cnt2 = 0;
                    for (var j = 0; j < 2; ++j) {
                        new Person().storeUser("u" + j, "u" + j, function (err, person) {
                            if (err) {
                                console.error("could not save new person with name " + person.username, err);
                            } else {
                                cnt2++;
                                console.log(cnt2 + " Successfully saved new person with username " + person.username);
                                if (cnt2 == 2) {//done adding
                                    //Here the actual test starts --> log in, then get access
                                    testSession
                                        .post('/login')
                                        .send({username: 'u0', password: 'u0'})
                                        .expect(200)
                                        .end(function () {
                                            testSession
                                                .get('/consents/grantdataaccess')
                                                .expect(200)
                                                .end(function (err, res) {
                                                    var html = jade.renderFile('./views/grantdataaccess.jade', {
                                                        user: 'u0',
                                                        usernames: ["u1"]
                                                    }, null);
                                                    res.text.should.equal(html);
                                                    done();
                                                });
                                        });
                                }
                            }
                        });
                    }
                }
            });
        }

    });

    describe('Get user that have no consent with the user yet', function () {

        it('should retrieve only those users that do not already contain a consent in the consent database', function (done) {
            var counter = 0;
            //make a consent
            var keyPair = security.createKeyPair();
            new Consent().createConsent("sender", "receiver", "super difficult key", keyPair.privateKey, function (err, consent) {
                functionsToTest.getUsersWithoutAccess();
            });
        });
    });
});

