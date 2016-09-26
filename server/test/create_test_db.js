/**
 * Clears an existing database and creates new datasets to be used in tests
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
var mongoose = require('mongoose');


var public = fs.readFileSync('./test/public.txt')
var private = fs.readFileSync('./test/private.txt')
var encryptionKey = "1234";
var nrOfAccounts = 10;

/** Used to count all creations... to exit the application when finished*/
var counts = 0;
/** How many consents (see defined below*/
var nrOfConsents = 10;
/** 30 */
var MAX_COUNTS = nrOfAccounts + nrOfAccounts + nrOfConsents;

function clearDB() {
    for (var i in mongoose.connection.collections) {
        mongoose.connection.collections[i].remove(function () {
        });
    }
}
var saveFunct = function (err, consent) {
    if (err) {
        console.error(err);
    }
    //Add count and if enough, exit applications
    counts++;
    console.log("Created " + counts + "/" + MAX_COUNTS + " data items.");
    if (counts == MAX_COUNTS) {
        console.log("Finished creation of test db");
        process.exit(1);
    }

};


clearDB();

for (var i = 1; i <= nrOfAccounts; ++i) {
    var username = "u" + i;
    Account.register(new Account({username: username}), username, saveFunct);

    var person = new Person();
    person.username = username;
    person.publicKey = public;
    person.privateKeyEnc = security.symmetricEncrypt(private, username);
    person.encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, public);

    person.spirometryData = [];
    for (var j = 0; j < 5; ++j) {
        var toEncrypt = {
            title: "data1_" + username,
            dateTime: new Date().toJSON(),
            fvc: Math.floor((Math.random() * 1000) + 1),
            fev1: Math.floor((Math.random() * 1000) + 1)
        };
        var dataToEncrypt = JSON.stringify(toEncrypt);
        var encryptedData = security.symmetricEncrypt(dataToEncrypt, encryptionKey);
        person.spirometryData.push(encryptedData);
    }

    person.save(saveFunct);
}
// encryptionKey, publicKey, saveFunction

new Consent().createConsent("u1", "u2", encryptionKey, public, saveFunct);
new Consent().createConsent("u1", "u3", encryptionKey, public, saveFunct);
new Consent().createConsent("u1", "u4", encryptionKey, public, saveFunct);
new Consent().createConsent("u1", "u5", encryptionKey, public, saveFunct);
new Consent().createConsent("u1", "u6", encryptionKey, public, saveFunct);
new Consent().createConsent("u2", "u1", encryptionKey, public, saveFunct);
new Consent().createConsent("u2", "u3", encryptionKey, public, saveFunct);
new Consent().createConsent("u2", "u4", encryptionKey, public, saveFunct);
new Consent().createConsent("u2", "u5", encryptionKey, public, saveFunct);
new Consent().createConsent("u2", "u6", encryptionKey, public, saveFunct);
