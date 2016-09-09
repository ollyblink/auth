var session = require('supertest-session');
var config = require('../config/config');
var mongoose = require('mongoose');
var http = require('http');
var expect = require('chai').expect;
var should = require('should');
var Person = require('../models/person');
var Account = require('../models/account');

describe('loading express', function () {
    var server;
    var testSession;
    beforeEach(function () {
        delete require.cache[require.resolve('../app')]; //needed to have a clear server with every unit test
        config.db.production = config.db.test; // i do this to change the db. not so nice i know

        clearDB();
        var app = require('../app');
        server = http.createServer(app);
        server.listen(3000);

        testSession = session(app);
    });
    afterEach(function (done) {
        clearDB();
        server.close(done);
    });
    function clearDB() {
        for (var i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function () {
            });
        }
    }

    describe('Registering and login', function () {
        it('it should be possible to add a new user', function (done) {
            this.timeout(10000); //may take time to create the PKI
            testSession
                .post('/register')
                .send({username: 'u1', password: 'u1'})
                .expect(302).end(function (err, res) {
                Person.findOne({username: 'u1'}, function (err, person) {
                    if (err) {
                        console.err("Error occured: " + err);
                        should.fail("no person found!");
                    }
                    if (!person) {
                        should.fail("no person found!");
                    } else {
                        console.log("found person!");

                        expect(person.username).to.equal('u1');
                        expect(person.publicKey).to.exist; // cannot say more about it
                        expect(person.privateKeyEnc).to.exist; // cannot say more about it
                        expect(person.encryptionKeyEnc).to.exist; // cannot say more about it
                        expect(person.spirometryData).to.exist;
                        expect(person.spirometryData).to.have.length(0);
                    }
                    done();

                });
            });
        });

        it('it should be possible to log in', function (done) {
            this.timeout(10000); //may take time to create the PKI
            var username = 'u1', password = 'u1';
            Account.register(new Account({username: username}), password, function (err, account) {
                if (!err) {
                    new Person().storeUser(username, password, function (err, person) {
                        if (!err) {
                            console.log("inside person");
                            testSession
                                .post('/login')
                                .send({username: 'u1', password: 'u1'})
                                .expect(200)
                                .end(done);
                        } else {
                            should.fail("got an error: " + err);
                        }
                    });
                } else {
                    should.fail("got an error: " + err);
                }
            });
        });
    });


});