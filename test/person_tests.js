var config = require('../config/config');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Person = require('../models/person');


// ensure the NODE_ENV is set to 'test'
// this is helpful when you would like to change behavior when testing
process.env.NODE_ENV = 'test';

beforeEach(function (done) {

    function clearDB() {
        for (var i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function () {
            });
        }
        return done();
    }

    if (mongoose.connection.readyState === 0) {
        mongoose.connect(config.db.test, function (err) {
            if (err) {
                throw err;
            }
            return clearDB();
        });
    } else {
        return clearDB();
    }
});

afterEach(function (done) {
    mongoose.disconnect();
    return done();
});

describe('Person#storeUser', function () {
    it('should create a new user u1 and all associated keys', function (done) {
        this.timeout(10000); //may take time to create the PKI
        var username = "u1";
        var password = "u1";
        new Person().storeUser(username, password, function (err, person) {
            if (err) {
                console.error("could not save new person with name " + person.username, err);
                done(err);
            }
            console.log("Successfully saved new person with username " + person.username);

            expect(person.username).to.equal('u1');
            expect(person.publicKey).to.exist; // cannot say more about it
            expect(person.privateKeyEnc).to.exist; // cannot say more about it
            expect(person.encryptionKeyEnc).to.exist; // cannot say more about it
            expect(person.spirometryData).to.exist;
            expect(person.spirometryData).to.have.length(0);
            done();
        });
    });
    it('should not be possible to create two users with the same username', function (done) {
        this.timeout(10000); //may take time to create the PKI
        var username = "u1";
        var password = "u1";
        new Person().storeUser(username, password, function (err, person) {
            new Person().storeUser(username, password, function (err, person) {
                expect(err.code).to.equal(11000); //Duplicate
                console.log("Error: "+ err);
                done();
            });
        });
    });
});