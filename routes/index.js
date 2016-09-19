var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var security = require('../utils/security/securityhelper');
var config = require("../config/config")
var router = express.Router();
//Import the required models
var Account = require('../models/account');
var Person = require('../models/person');
var errorchecker = require('../utils/error/errorhelper');

/**
 * log out. Redirects to login
 */
router.get('/logout', function (req, res) {
    req.logout();
    res.status(200).json({
        message:"Successfully logged out"
    });
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
        errorchecker.check(err);
        new Person().storeUser(username, password, function (err, person) {
            if (err) {
                console.error(err);
                res.status(err.status || 500);
                res.json({
                    message: err.message,
                    error: err
                });
            } else {
                console.log("Successfully saved new person with username " + person.username);
                passport.authenticate('local')(req, res, function () {
                    res.status(200).json({
                        message: "Successfully created user with username " + username
                    });
                });
            }
        });
    });
});


/**
 * Login with a session
 */
router.post('/login', passport.authenticate('local', {session: config.withSession}), function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log("user " + username + " tries to log in");

    Person.findOne({username: username}, function (err, user) {
        errorchecker.check(err);

        //Decrypt the private key using the password in clear text
        var privateKey = security.symmetricDecrypt(user.privateKeyEnc, password);
        //Decrypt the encryption key using the decrypted private key
        var encryptionKey = security.decryptStringWithRsaPrivateKey(user.encryptionKeyEnc, privateKey);
        //Store the private key in the session for later use
        req.session.privateKey = privateKey;
        //Store the encryption key in the session for later use
        req.session.encryptionKey = encryptionKey;

        console.log("user " + username + " logged in");
        res.status(200).json({
            user: username
        });
    });

});


module.exports = router;