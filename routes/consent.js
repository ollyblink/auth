var express = require('express');
var passport = require('passport');
var router = express.Router();
var authentication = require('../utils/authentication/authenticationhelper');
var errorchecker = require('../utils/error/errorhelper');
//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');

/**
 * returns all users that data access can still be granted (all possible minus the ones that are already granted)
 */
router.get('/', authentication.isLoggedIn, function (req, res) {
    Person.find({
        username: {
            $ne: req.user.username
        }
    }, function (err, people) {
        errorchecker.check(err);
        var authorisableUsers = [];
        for (var i = 0; i < people.length; ++i) {
            authorisableUsers.push(people[i].username);
        }
        // //now remove all those where a consent already exists
        Consent.find().where('sender').equals(req.user.username).exec(function (err, consents) {
            errorchecker.check(err);

            console.log("Possible users: [" + authorisableUsers.length + "]/" + authorisableUsers);
            console.log("Consents found: [" + consents.length + "]/" + consents);

            for (var i = 0; i < consents.length; ++i) {
                var index = authorisableUsers.indexOf(consents[i].receiver);

                console.log("consent receiver[" + consents[i].receiver + "], at index [" + index + "]");

                if (index >= 0) { // don't want to include those that we already granted access to the data
                    console.log("Found user [" + consents[i].receiver + "]");
                    authorisableUsers.splice(index, 1);
                }
            }

            console.log("Remaining users to grant access to data to: [" + authorisableUsers.length + "]/" + authorisableUsers);
            res.status(200).json({
                user: req.user.username,
                authorisableUsers: authorisableUsers
            });
        });
    });
});

/**
 * Returns all users that can access my data
 */
router.get('/sent', authentication.isLoggedIn, function (req, res) {
    findConsents(req.user.username, 'sender', res);
});

/**
 * Returns all users that this user has data access to
 */
router.get('/received', authentication.isLoggedIn, function (req, res) {
    findConsents(req.user.username, 'receiver', res);
});

var findConsents = function (user, userField, res) {
    Consent.find().where(userField).equals(user).exec(function (err, consents) {
        errorchecker.check(err);

        var consentedUsers = [];
        if (consents) {
            for (var i = 0; i < consents.length; i++) {
                if (userField === 'receiver') {
                    consentedUsers.push(consents[i].sender);
                } else { //(if userField === 'sender')
                    consentedUsers.push(consents[i].receiver);
                }
            }
        }
        console.log("Found: " + JSON.stringify(consentedUsers));
        res.status(200).json({
            user: user,
            consentedUsers: consentedUsers
        });
    });
}

/**
 * Deletes a consens for a specified receiver
 */
router.delete('/sender/:sender/receiver/:receiver', authentication.isLoggedIn, function (req, res) {
    if (req.params.sender !== req.user.username) {
        res.status(403).json({success: false, message: "Not allowed to delete specified item"});
    }
    Consent.remove({sender: req.user.username, receiver: req.params.receiver}, function (err) {
        errorchecker.check(err);

        res.status(200).json({
            message: "Successfully removed consent with sender " + req.user.username + " and receiver " + req.params.receiver
        });
    });
});


/**
 * Creates a new consent for a specified receiver
 */
router.post('/', authentication.isLoggedIn, function (req, res) {
    /*
     * Get the other user's public key to encrypt this person's encryption key
     */
    Person.findOne({username: req.body.receiver}, function (err, person) {
        errorchecker.check(err);
        if (person) {
            new Consent().createConsent(req.user.username, person.username, req.session.encryptionKey, person.publicKey, function (err, consent) {
                errorchecker.check(err);

                res.status(200).json({
                    message: "Successfully saved new consent for user " + consent.receiver,
                    receiver: consent.receiver
                });
            });
        } else {
            res.status(404).json({
                message: "Could not find user  " + req.body.receiver,
                receiver: req.body.receiver
            });
        }
    });

});
module.exports = router;
