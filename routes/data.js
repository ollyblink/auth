var express = require('express');
var passport = require('passport');
var security = require('../security/securityhelper');
var config = require("../config/config")

var router = express.Router();

//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');

router.get('/', function (req, res) {
    res.status(200).send('ok');
});

router.get('/showdata/:username', security.isLoggedIn, function (req, res) {
    console.log("key: " + req.session.encryptionKey);
    console.log("user: " + req.params.username);
    console.log("user in session: " + req.user.username);
    if (req.params.username !== req.user.username) {
        var username = req.params.username;
        //external user specified in link
        Consent.findOne()
            .where('sender').equals(username)
            .where('receiver').equals(req.user.username)
            .select('encryptionKeyEnc').exec(function (err, data) {
            console.log("inside findOne")
            if (data) {
                console.log("encKeyenc: " + data.encryptionKeyEnc);
                var usersEncryptionKey = security.decryptStringWithRsaPrivateKey(data.encryptionKeyEnc, req.session.privateKey);
                console.log("decrypted enc key " + usersEncryptionKey);
                findDataForUser(username, usersEncryptionKey, req, res);
            } else {
                console.error("Could not find matching consent for user " + username);
            }
        });
    } else { // no user name specified --> display own data
        findDataForUser(req.user.username, req.session.encryptionKey, req, res);
    }
});

function findDataForUser(username, encryptionKey, req, res) {
    console.log("username: " + username + ", enckey: " + encryptionKey);
    Person.findOne()
        .where('username').equals(username)
        .select('spirometryData').exec(function (err, data) {

        if (err) {
            console.log("Error occurred while retrieving spirometry data for user " + username);
            res.redirect("/login");
        }
        console.log("inside person");
        var decryptedData = [];
        for (var i = 0; i < data.spirometryData.length; ++i) {
            var decryptedDataItem = security.symmetricDecrypt(data.spirometryData[i], encryptionKey);
            decryptedData.push(JSON.parse(decryptedDataItem));
        }
        console.log("all items: " + JSON.stringify(decryptedData));
        res.render("data", {spirometryData: decryptedData, ofUser: username, user: req.user.username});
    });
}

/**
 * Should be put/update
router.get('/updatedata/item/:itemtitle', security.isLoggedIn, function (req, res) {
    var username = req.user.username;
     Person.findOne()
        .where('username').equals(username)
        .select('spirometryData').exec(function (err, data) {
            if (err) {
                console.log("Error occurred while retrieving spirometry data for user " + username);
                res.redirect("/login");
            }
            for (var i = 0; i < data.spirometryData.length; ++i) {
                var decryptedDataItem = security.symmetricDecrypt(data.spirometryData[i], req.session.encryptionKey);
                var dataset = JSON.parse(decryptedDataItem);
                if(dataset.title === req.params.itemtitle){
                    console.log("Found data: "+ JSON.stringify(dataset));
                    res.render('adddata', {user: req.user.username, dataset: dataset});
                }
            }
            res.render('addddata', {user: req.user.username});
    });
});

 */
router.get('/adddata', security.isLoggedIn, function (req, res) {
    res.render('adddata', {user: req.user.username});
});

/**
 * should be delete
 */
router.get('/deletedata/item/:itemtitle', security.isLoggedIn, function (req, res) {
    console.log("delete data " + req.params.itemtitle);
    var username = req.user.username;
    console.log("user: " + username);
    Person.findOne({username: username})
        .exec(function (err, user) {
            if (err) {
                console.log("Error occurred while retrieving spirometry data for user " + username);
                res.redirect("/login");
            }

            console.log("user: " + user.spirometryData.length);
            for (var i = 0; i < user.spirometryData.length; ++i) {
                var decryptedDataItem = security.symmetricDecrypt(user.spirometryData[i], req.session.encryptionKey);
                var asJSON = JSON.parse(decryptedDataItem);
                console.log("Json: " + JSON.stringify(asJSON));
                if (asJSON.title === req.params.itemtitle) {
                    console.log("item: " + user.spirometryData[i]);
                    user.spirometryData.splice(i, 1); //removes item at index i
                    break;
                }
            }
            user.save();
            res.redirect('/data/showdata/' + username);
        });
});

router.post('/spirometrydataitem', security.isLoggedIn, function (req, res) {
    Person.findOne({username: req.user.username}).exec(function (err, user) {
        if (err) {
            console.log("an error occured: " + err.message);
            res.redirect("/");
        }
        var itemtitle = req.body.itemtitle; //may only be set in case of an update


        var title = req.body.title;
        var dateTime = Date.now();
        var fvc = req.body.fvc;
        var fev1 = req.body.fev1;

        if(itemtitle){ //Update
            for (var i = 0; i < user.spirometryData.length; ++i) {
                var decryptedDataItem = security.symmetricDecrypt(user.spirometryData[i], req.session.encryptionKey);
                var dataset = JSON.parse(decryptedDataItem);
                if(dataset.title === itemtitle){
                    console.log("update data: "+ JSON.stringify(dataset));
                    dataset.title = title;
                    dataset.fvc = fvc;
                    dataset.fev1 = fev1;
                    var newEncryptedDataItem = security.symmetricEncrypt(JSON.stringify(dataset), req.session.encryptionKey);

                    user.splice(i, 1, newEncryptedDataItem); //Delete old dataset and add new dataset instead
                    user.save();

                    res.redirect('/data/showdata/' + req.user.username);
                    break;
                }
            }
        }else { //create new entry
            var toEncrypt = {
                title: title,
                dateTime: dateTime,
                fvc: fvc,
                fev1: fev1
            };
            var dataToEncrypt = JSON.stringify(toEncrypt);
            var encryptedData = security.symmetricEncrypt(dataToEncrypt, req.session.encryptionKey);
            user.spirometryData.push(encryptedData);
        }
        user.save();
        console.log("to encrypt: " + JSON.stringify(toEncrypt));
        console.log("encKey: " + req.session.encryptionKey);
        console.log("Datastring:" + dataToEncrypt);
        console.log("encData: " + encryptedData);
        res.redirect('/data/showdata/' + req.user.username);
    });

});


module.exports = router;