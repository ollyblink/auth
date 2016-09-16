var express = require('express');
var passport = require('passport');
var router = express.Router();
var authentication = require('../utils/authentication/authenticationhelper');

//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');

/**
 * returns all users that data access can still be granted (all possible minus the ones that are already granted)
 */
router.get('/possibleconsents', authentication.isLoggedIn, function (req, res) {
    Person.find({
        username: {
            $ne: req.user.username
        }
    }, function (err, people) {
        if (err) {
            console.error(err);
            res.status(500).json({error: err});
        }
        var authorisableUsers = [];
        for (var i = 0; i < people.length; ++i) {
            authorisableUsers.push(people[i].username);
        }
        // //now remove all those where a consent already exists
        Consent.find().where('sender').equals(req.user.username).exec(function (err, consents) {
            if (err) {
                console.error(err);
                res.status(500).json({error: err});
            }
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
            res.status(200).json({success: true, user: req.user.username, authorisableUsers: authorisableUsers});
        });
    });
});


router.get('/sentconsents', authentication.isLoggedIn, function (req, res) {
    findConsents(req.user.username, 'sender', res);
});

router.get('/receivedconsents', authentication.isLoggedIn, function (req, res) {
    findConsents(req.user.username, 'receiver', res);
});

var findConsents = function (user, userField, res) {
    Consent.find().where(userField).equals(user).exec(function (err, consents) {
        if (err) {
            console.error(err);
            res.status(500).json({success: false, message: err});
        }
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
        res.status(200).json({success: true, user: user, consentedUsers: consentedUsers});
    });
}

router.delete('/deleteconsent/consentid/:consentid', authentication.isLoggedIn, function (req, res) {
    Consent.remove({_id: req.params.consentid}, function (err) {
        if (err) {
            res.status(500).json({success: false, message: err});
        }
        else {
            res.status(200).json({
                success: true,
                message: "Successfully removed consent with id: " + req.params.consentid
            });
        }
    });
});

router.post('/grantdataaccess', authentication.isLoggedIn, function (req, res) {
    /*
     * Get the other user's public key to encrypt this person's encryption key
     */
    Person.findOne({username: req.body.receiver}, function (err, person) {
        if (err) {
            console.error(err);
            res.status(500).json({success: false, message: err});
        }
        new Consent().createConsent(req.user.username, person.username, req.session.encryptionKey, person.publicKey, function (err, consent) {
            if (err) {
                res.status(500).json({success: false, message: err});
            } else {
                res.status(200).json({
                    success: true,
                    message: "Successfully saved new consent for user " + consent.receiver,
                    consentid: consent._id
                });
            }
        });

    });

});
module.exports = router;
