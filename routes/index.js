var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var security = require('../security/securityhelper');
var config = require("../config/config")

var router = express.Router();


//Import the required models
var Account = require('../models/account');
var Person = require('../models/person');
var Consent = require('../models/consent');


router.get('/', function (req, res) {
    res.redirect('/login');
});

router.get('/register', function (req, res) {
    res.render('register', {});
});


/**
 * On registry, a new user is created. additionally, a PKI key pair is created and a symmetric encryption key.
 * The idea is to create all required keys and encrypt them appropriately.
 * The private key is encrypted using the password, the encryption key is encrypted using the private key.
 * the encryption key currently is just a simple string containing some numbers and letters,
 * may be something different entirely depending on the requirements.
 * Person needs to add more fields (address, age, etc.) and also data items I assume?
 *
 */
router.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Account.register(new Account({username: username}), password, function (err, account) {
        if (err) {
            console.log("Error while registering user.", err);
            res.locals.err = err.message;
            return res.render('register', {account: account});
        }

        var keyPair = security.createKeyPair();
        var privateKeyEnc = security.symmetricEncrypt(keyPair.privateKey, req.body.password);
        var encryptionKey = security.createRandomSymmetricKeyString();
        var encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, keyPair.publicKey);

        console.log("username: " + username + "\nPassword: " + password + "\npublicKey: " + keyPair.publicKey + "\nprivate key: " + keyPair.privateKey + "\nprivateKeyEnc: " + privateKeyEnc + "\nencryptionKey: " + encryptionKey + "\nencryptionKeyEnc: " + encryptionKeyEnc)
        var person = new Person({
            username: username,
            publicKey: keyPair.publicKey,
            privateKeyEnc: privateKeyEnc,
            encryptionKeyEnc: encryptionKeyEnc
        });

        person.save(function (err, person) {
            if (err) {
                console.error("could not save new person with name " + person.username, err);
                res.locals.error = err.message;
                res.redirect("/register");
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.locals.user = person;
                    res.redirect("/");
                });
                console.log("Successfully saved new person with username " + person.username);
            }
        });
    });
});


router.post('/login', passport.authenticate('local', {session: config.withSession}), function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Person.findOne({username: username}, function (err, user) {
        if (err) {
            console.error("Could not find user with username: " + username);
            res.redirect('/login');
        }
        //Decrypt the private key using the password in clear text
        var privateKey = security.symmetricDecrypt(user.privateKeyEnc, password);
        //Decrypt the encryption key using the decrypted private key
        var encryptionKey = security.decryptStringWithRsaPrivateKey(user.encryptionKeyEnc, privateKey);
        //Store the private key in the session for later use
        req.session.privateKey = privateKey;
        //Store the encryption key in the session for later use
        req.session.encryptionKey = encryptionKey;
        res.render('index', {user: username});
    });

});

router.get('/login', function (req, res) {
    res.render('login');
});


router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

router.get('/ping', function (req, res) {
    var isAuthen = "";
    if (req.user) {
        isAuthen = req.user + " User is authenticated. Should not happen";
    } else {
        isAuthen = "User is not authenticated. Thats what we want";
    }
    res.status(200).send(isAuthen);
});


module.exports = router;