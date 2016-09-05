var express = require('express');
var passport = require('passport');
var security = require('../security/securityhelper');
var router = express.Router();

//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');

router.get('/grantdataaccess', security.isLoggedIn, function (req, res) {
    Person.find({}, function (err, people) {
        if (err) {
            console.log("Problem with grantdataaccess.");
            res.render('/');
        }
        var usernames = [];

        for (var i = 0; i < people.length; ++i) {
            if (req.user.username !== people[i].username) {
                usernames.push(people[i].username);
            }
        }
        res.render('grantdataaccess', {usernames: usernames});
    });
});
router.get('/allconsents', security.isLoggedIn, function (req, res) {
    Consent.find().where('sender').equals(req.user.username).select('receiver').exec(function (err, users) {
        var grantedTo = [];
        if (users) {
            for (var i = 0; i < users.length; i++) {
                grantedTo.push(users[i].receiver);
            }
        }
        Consent.find().where('receiver').equals(req.user.username).select('sender').exec(function (err2, users2) {
            var grantedBy = [];
            if (users2) {
                for (var i = 0; i < users2.length; i++) {
                    grantedBy.push(users2[i].sender);
                }
            }
            console.log("Found: "+ JSON.stringify(grantedTo));
            console.log("Found: "+ JSON.stringify(grantedBy));
            res.render('consents', {grantedTo: grantedTo, grantedBy: grantedBy});
        });
    });
});

router.post('/grantdataaccess', security.isLoggedIn, function (req, res) {
    /*
     * Get the other user's public key to encrypt this person's encryption key
     */
    Person.findOne({username: req.body.receiver}, function (err, person) {
        if (err) {
            console.error("err: " + err.message);
            res.redirect("/");
        }

        var encryptionKeyEnc = security.encryptStringWithRsaPublicKey(req.session.encryptionKey, person.publicKey);
        console.log("Encryption key of sender after encrypting it with public key of receiver:\n" + encryptionKeyEnc);
        var consent = new Consent({
            sender: req.user.username,
            receiver: person.username,
            encryptionKeyEnc: encryptionKeyEnc
        });

        consent.save(function (err, consent) {
            if (err) {
                console.log("could not save new consent for user " + consent.receiver);
                return console.error(err);
            } else {
                console.log("Successfully saved new consent for user " + consent.receiver);
            }
        });
        res.redirect('/consents/allconsents');

    });

});
module.exports = router;