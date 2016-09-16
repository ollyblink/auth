/**
 * Used to create some users in the database for testing purposes
 * */
var counter = 0;
var security = require('../utils/security/securityhelper');
var mongoose = require('mongoose');
var Account = require('../models/account');
var Consent = require('../models/consent');
var Person = require('../models/person');
var config = require('../config/config');
var mongoose = require('mongoose');
config.db.prod = "mongodb://localhost/consent_routes_tests"; // i do this to change the db. not so nice i know
var fs = require("fs");

var db = require('../models/db').getDB("mongodb://localhost/consent_routes_tests");

var public = fs.readFileSync('./test/public.txt')
var private = fs.readFileSync('./test/private.txt')
var encryptionKey = "1234";
 var nrOfAccounts = 10;

function clearDB() {
    for (var i in mongoose.connection.collections) {
        mongoose.connection.collections[i].remove(function () {
        });
    }
}
var saveFunct = function(err, consent){
    if(err){
        console.error(err);
    }else{
        console.log("Saved");
    }
};


clearDB();
for (var i = 1; i <= nrOfAccounts; ++i) {
    var username = "u" + i;
    console.log(i);
    Account.register(new Account({username: username}), username, saveFunct);

    var person = new Person();
    person.username = username;
    person.publicKey = public;
    person.privateKeyEnc = security.symmetricEncrypt(private, username);
    person.encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, public);
    person.save(saveFunct);
}
// encryptionKey, publicKey, saveFunction

new Consent().createConsent("u1","u2", encryptionKey, public, saveFunct);
new Consent().createConsent("u1","u3", encryptionKey, public, saveFunct);
new Consent().createConsent("u1","u4", encryptionKey, public, saveFunct);
new Consent().createConsent("u1","u5", encryptionKey, public, saveFunct);
new Consent().createConsent("u1","u6", encryptionKey, public, saveFunct);
new Consent().createConsent("u2","u1", encryptionKey, public, saveFunct);
new Consent().createConsent("u2","u3", encryptionKey, public, saveFunct);
new Consent().createConsent("u2","u4", encryptionKey, public, saveFunct);
new Consent().createConsent("u2","u5", encryptionKey, public, saveFunct);
new Consent().createConsent("u2","u6", encryptionKey, public, saveFunct);