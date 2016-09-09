var config = require('../config/config');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Consent = require('../models/consent');
var security = require('../security/securityhelper');


describe('Consent#createConsent', function () {
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

    it('should create a new consent between two users', function (done) {
        this.timeout(10000); //may take time to create the PKI
        var sender = "u1";
        var receiver = "u2";
        var encryptionKey = "testKey1234";
        var keys = security.createKeyPair();

        //sender, receiver, encryptionKey, publicKey, saveFunction
        new Consent().createConsent(sender, receiver, encryptionKey, keys.publicKey, function (err, consent) {
            if (err) {
                console.error("could not save new consent ", err);
                done(err);
            }
            console.log("Successfully saved new consent");

            expect(consent.sender).to.equal('u1');
            expect(consent.receiver).to.equal('u2');
            expect(security.decryptStringWithRsaPrivateKey(consent.encryptionKeyEnc, keys.privateKey)).to.equal(encryptionKey);
            done();
        });
    });
});