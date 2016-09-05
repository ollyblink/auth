/**
 * As long as the typescript classes are making problems, these functions can be used instead.
 */
//TODO Refactor ... these functions come from AsymmetricEncryptionHelper.ts and SymmetricEncryptionHelper.ts

var crypto = require('crypto');
var nodeforge = require('node-forge');
module.exports = {
    symmetricEncrypt: function (text, encryptionkey) {
        var algorithm = "aes-256-ctr";
        var cipher = crypto.createCipher(algorithm, encryptionkey);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },

    symmetricDecrypt: function (text, encryptionkey) {
        var algorithm = "aes-256-ctr";
        var decipher = crypto.createDecipher(algorithm, encryptionkey);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },

    encryptStringWithRsaPublicKey: function (textToEncrypt, publicKey) {
        var buffer = new Buffer(textToEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    },
    decryptStringWithRsaPrivateKey: function (textToDecrypt, privateKey) {
        var buffer = new Buffer(textToDecrypt, "base64");
        var decrypted = crypto.privateDecrypt(privateKey, buffer);
        return decrypted.toString("utf8");
    },
    createKeyPair: function () {
        var pair = nodeforge.pki.rsa.generateKeyPair();
        var publicKey = nodeforge.pki.publicKeyToPem(pair.publicKey);
        var privateKey = nodeforge.pki.privateKeyToPem(pair.privateKey);
        return {"privateKey": privateKey, "publicKey": publicKey};
    },
    createRandomSymmetricKeyString: function (nrOfBytes) {
        if (!nrOfBytes) {
            nrOfBytes = 128; //Default is 128
        }
        return crypto.randomBytes(nrOfBytes).toString('base64');
    },
    isLoggedIn: function (req, res, next) {
         if (!req.isAuthenticated()) {
            console.log("Not authenticated");
            res.redirect("/login");
        } else {
            next();
        }
    }
}
