var express = require('express');
var security = require('../utils/security/securityhelper');
var authentication = require('../utils/authentication/authenticationhelper');
var config = require("../config/config")

var router = express.Router();

//Import the required models
var Person = require('../models/person');
var Consent = require('../models/consent');
var errorchecker = require('../utils/error/errorhelper');


/**
 * Retrieves all data for a user specified by its username.
 * If the requesting user is the same as the user whose data items are requested, the encryption key is taken directly from the session.
 * Else, it needs to be checked if the requesting user is allowed to access the data item of the user. For this,
 * a consent needs to exist, which is checked first.
 */
router.get('/username/:username', authentication.isLoggedIn, function (req, res) {
    console.log("key: " + req.session.encryptionKey);
    console.log("user: " + req.params.username);
    console.log("user in session: " + req.user.username);

    var userToFind;
    var encryptionKey;

    //Means that you need to have a consent to access this data item.
    if (req.params.username !== req.user.username) {
        userToFind = req.params.username;
        console.log("User to find data for: [" + userToFind + "]");
        //external user specified in link
        Consent.findOne()
            .where('sender').equals(userToFind)
            .where('receiver').equals(req.user.username)
            .select('encryptionKeyEnc').exec(function (err, data) {
            errorchecker.check(err);

            if (data) {
                encryptionKey = security.decryptStringWithRsaPrivateKey(data.encryptionKeyEnc, req.session.privateKey);
                console.log("decrypted enc key " + encryptionKey);
                findDataForUser(userToFind, encryptionKey, res);
            } else {
                var notFoundMsg = "Could not find matching consent for user " + userToFind;
                console.error(notFoundMsg);
                res.status(404).json({
                    message: notFoundMsg
                });
            }

        });
    } else { // no user name specified --> display own data
        userToFind = req.params.username;
        encryptionKey = req.session.encryptionKey;
        findDataForUser(userToFind, encryptionKey, res);
    }
});


/**
 * Retrieves the data for a specified user (specified by username)
 *
 * @param username the user to retrieve the data from
 * @param encryptionKey the user's encryption key to decrypt the data
 * @param userToFind
 * @param res
 */
function findDataForUser(userToFind, encryptionKey, res) {
    Person.findOne()
        .where('username').equals(userToFind)
        .select('spirometryData').exec(function (err, data) {

        errorchecker.check(err);

        console.log("Found data for user[" + userToFind + "]");
        var decryptedData = [];
        for (var i = 0; i < data.spirometryData.length; ++i) {
            var decryptedDataItem = security.symmetricDecrypt(data.spirometryData[i], encryptionKey);
            var asJson = JSON.parse(decryptedDataItem);
            decryptedData.push(asJson);
        }
        console.log("All data items found for user [" + userToFind + "]: " + JSON.stringify(decryptedData));

        //res.render("data", {spirometryData: decryptedData, ofUser: userToFind, user: userToFind});
        res.status(200).json({
            user: userToFind,
            spirometryData: decryptedData});
    });
};


router.delete('/user/:user/item/:itemtitle', authentication.isLoggedIn, function (req, res) {
    //Can only remove if the user is the same as the logged in user
    if (req.params.user !== req.user.username) {
        res.status(403).json({success: false, message: "Not allowed to delete specified item"});
    }
    console.log("delete data " + req.params.itemtitle);
    var username = req.params.user;
    console.log("user: " + username);

    Person.findOne({username: username}).exec(function (err, user) {
        errorchecker.check(err);

        console.log("#data items: " + user.spirometryData.length);
        for (var i = 0; i < user.spirometryData.length; ++i) {
            var decryptedDataItem = security.symmetricDecrypt(user.spirometryData[i], req.session.encryptionKey);
            var asJSON = JSON.parse(decryptedDataItem);
            console.log("Json: " + JSON.stringify(asJSON));
            if (asJSON.title === req.params.itemtitle) {
                console.log("item: " + user.spirometryData[i]);
                user.spirometryData.splice(i, 1); //removes item at index i
            }
        }
        user.save(function (err, user) {
            errorchecker.check(err);

            res.status(200).json({
                message: "Successfully removed data item with title [" + req.params.itemtitle + "] for user " + username
            });
        });
    });
});

router.post('/', authentication.isLoggedIn, function (req, res) {
    Person.findOne({username: req.user.username}).exec(function (err, user) {
        errorchecker.check(err);


        var title = req.body.title;
        var dateTime = new Date().toJSON();
        var fvc = req.body.fvc;
        var fev1 = req.body.fev1;

        var toEncrypt = {
            title: title,
            dateTime: dateTime,
            fvc: fvc,
            fev1: fev1
        };
        var dataToEncrypt = JSON.stringify(toEncrypt);
        var encryptedData = security.symmetricEncrypt(dataToEncrypt, req.session.encryptionKey);
        user.spirometryData.push(encryptedData);

        user.save(function (err, user) {
            errorchecker.check(err);


            console.log("to encrypt: " + JSON.stringify(toEncrypt));
            console.log("encKey: " + req.session.encryptionKey);
            console.log("Datastring:" + dataToEncrypt);
            console.log("encData: " + encryptedData);
            res.status(201).json({
                message: "Successfully stored item with title " + title
            });

        });
    });
});

//Reconsider how to do it (everything in the url)
// router.put('/spirometrydataitem', authentication.isLoggedIn, function (req, res) {
//     Person.findOne({username: req.user.username}).exec(function (err, user) {
//         if (err) {
//             console.error(err);
//             res.status(500).json({success: false, message: err});
//         }
//         var itemtitle = req.body.itemtitle; //may only be set in case of an update
//
//         var title = req.body.title;
//         var fvc = req.body.fvc;
//         var fev1 = req.body.fev1;
//         var msg = "";
//         var status = 201;
//
//         for (var i = 0; i < user.spirometryData.length; ++i) {
//             var decryptedDataItem = security.symmetricDecrypt(user.spirometryData[i], req.session.encryptionKey);
//             var dataset = JSON.parse(decryptedDataItem);
//             if (dataset.title === itemtitle) {
//                 console.log("update data: " + JSON.stringify(dataset));
//                 dataset.title = title;
//                 dataset.fvc = fvc;
//                 dataset.fev1 = fev1;
//                 console.log("enc key: " + req.session.encryptionKey);
//                 //TODO sth is fishy here
//                 var newEncryptedDataItem = security.symmetricEncrypt(JSON.stringify(dataset), req.session.encryptionKey);
//                 user.splice(i, 1, newEncryptedDataItem); //Delete old data set and add new data set instead
//                 user.save();
//                 console.log(msg);
//                 msg = "Updated data item with title [" + dataset.title + "]";
//                 status = 201;
//                 break;
//             }
//         }
//
//         user.save(function (err, user) {
//             if (err) {
//                 console.error(err);
//                 res.status(500).json({success: false, message: err});
//             } else {
//                 console.log("to encrypt: " + JSON.stringify(toEncrypt));
//                 console.log("encKey: " + req.session.encryptionKey);
//                 console.log("Datastring:" + dataToEncrypt);
//                 console.log("encData: " + encryptedData);
//                 res.status(201).json({success: true, message: "Successfully updated item"});
//             }
//         });
//         console.log("to encrypt: " + JSON.stringify(toEncrypt));
//         console.log("encKey: " + req.session.encryptionKey);
//         console.log("encData: " + encryptedData);
//         if (msg.length == 0) {
//             msg = "Did not find item with title [" + itemtitle + "]";
//             status = 302;
//         }
//         res.status(status).json({"message": msg});
//
//     });
// });


module.exports = router;