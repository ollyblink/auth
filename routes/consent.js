var express = require('express');
var passport = require('passport');
var router = express.Router();

var authentication = require('../utils/authentication/authenticationhelper');

//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');

router.get('/grantdataaccess', authentication.isLoggedIn, function (req, res) {
    Person.find({
        username: {
            $ne: req.user.username
        }
    }, function (err, people) {
        if (err) {
            console.error("Problem with grantdataaccess.");
            res.render('/');
        }
        var usernames = [];
        for (var i = 0; i < people.length; ++i) {
            usernames.push(people[i].username);
        }
        // //now remove all those where a consent already exists
        getUsersWithoutAccess(req.user.username, usernames, res);

    });
});

var getUsersWithoutAccess = function (username, possibleUserNames, res) {
    Consent.find().where('sender').equals(username).exec(function (err, consents) {
        if (err) {
            console.error("Problem with getUsersWithoutAccess.");
            res.render('/');
        }
        console.log("Possible users: [" + possibleUserNames.length + "]/" + possibleUserNames);
        var all = "";
        for (var i = 0; i < consents.length; ++i) {
            all += consents[i].receiver + ", ";
        }
        console.log("Consents found: [" + consents.length + "]/" + all);

        if (consents.length > 0) {
            for (var i = 0; i < consents.length; ++i) {
                var index = possibleUserNames.indexOf(consents[i].receiver);
                console.log("consent receiver[" + consents[i].receiver + "], at index ["+index+"]");
                if (index >= 0) { // don't want to include those that we already granted access to the data
                    console.log("Found user [" + consents[i].receiver + "]");
                    possibleUserNames.splice(index, 1);
                }
            }
        }

        console.log("Remaining users to grant access to data to: [" + possibleUserNames.length + "]/" + possibleUserNames);

        res.render('grantdataaccess', {user: username, usernames: possibleUserNames});

    });
}


router.get('/allconsents', authentication.isLoggedIn, function (req, res) {
    Consent.find().where('sender').equals(req.user.username).exec(function (err, consents) {
        var grantedTo = [];
        if (consents) {
            for (var i = 0; i < consents.length; i++) {
                grantedTo.push(consents[i]);
            }
        }
        Consent.find().where('receiver').equals(req.user.username).exec(function (err2, consents2) {
            var grantedBy = [];
            if (consents2) {
                for (var i = 0; i < consents2.length; i++) {
                    grantedBy.push(consents2[i]);
                }
            }
            console.log("Found: " + JSON.stringify(grantedTo));
            console.log("Found: " + JSON.stringify(grantedBy));
            res.render('consents', {grantedTo: grantedTo, grantedBy: grantedBy, user: req.user.username});
        });
    });
});

/**
 * should be delete
 */
router.get('/deleteconsent/consentid/:consentid', authentication.isLoggedIn, function (req, res) {
    Consent.remove({_id: req.params.consentid}, function (err) {
        if (err) {
            console.error("Could not remove consent with id: " + req.params.consentid);
        }
        else {
            console.error("Successfully removed consent with id: " + req.params.consentid);
        }
        res.redirect("/consents/allconsents");
    });
});

router.post('/grantdataaccess', authentication.isLoggedIn, function (req, res) {
    /*
     * Get the other user's public key to encrypt this person's encryption key
     */
    Person.findOne({username: req.body.receiver}, function (err, person) {
        if (err) {
            console.error("err: " + err.message);
            res.redirect("/");
        }

        new Consent().createConsent(req.user.username, person.username, req.session.encryptionKey, person.publicKey, function (err, consent) {
            if (err) {
                console.log("could not save new consent for user " + consent.receiver);
                return console.error(err);
            } else {
                console.log("Successfully saved new consent for user " + consent.receiver);
            }
            res.redirect('/consents/allconsents');
        });

    });

});
module.exports = router;
