/**
 * As long as the typescript classes are making problems, these functions can be used instead.
 Provides all the helper classes for symmetric and assymetric encryption/decryption
 */
//TODO Refactor ... these functions come from AsymmetricEncryptionHelper.ts and SymmetricEncryptionHelper.ts

var crypto = require('crypto');
var nodeforge = require('node-forge');

module.exports = {
    /**
     * Encrypts a text item symmetrically
     * @param text the text to encrypt
     * @param encryptionkey the symmetric key to encrypt the data
     * @returns {Buffer|string} the crypted text
     */
    symmetricEncrypt: function (text, encryptionkey) {
        var algorithm = "aes-256-ctr";
        var cipher = crypto.createCipher(algorithm, encryptionkey);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },

    /**
     * Decrypts a symmetrically encrypted data item.
     *
     * @param cryptedText the text to decrypt
     * @param encryptionkey the symmetric key used to decrypt the data item
     * @returns {Buffer|string} the decrypted text
     */
    symmetricDecrypt: function (cryptedText, encryptionkey) {
        var algorithm = "aes-256-ctr";
        var decipher = crypto.createDecipher(algorithm, encryptionkey);
        var dec = decipher.update(cryptedText, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },

    /**
     * Encrypts a string with a public key
     *
     * @param textToEncrypt data to be encrypted
     * @param publicKey RSA public key, needs to have an according private key
     * @returns encrypted text
     */
    encryptStringWithRsaPublicKey: function (textToEncrypt, publicKey) {
        var buffer = new Buffer(textToEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    },

    /**
     * Decrypts a string with a private key
     * @param textToDecrypt encrypted text to decrypt
     * @param privateKey RSA private key, needs to have an according public key
     * @returns {*}
     */
    decryptStringWithRsaPrivateKey: function (textToDecrypt, privateKey) {
        var buffer = new Buffer(textToDecrypt, "base64");
        var decrypted = crypto.privateDecrypt(privateKey, buffer);
        return decrypted.toString("utf8");
    },

    /**
     * Creates a new RSA Public/Private key pair and returns them as an object
     *
     * @returns {{privateKey: the private key, publicKey: the public key}}
     */
    createKeyPair: function () {
        var pair = nodeforge.pki.rsa.generateKeyPair();
        var publicKey = nodeforge.pki.publicKeyToPem(pair.publicKey);
        var privateKey = nodeforge.pki.privateKeyToPem(pair.privateKey);
        return {"privateKey": privateKey, "publicKey": publicKey};
    },

    /**
     * Creates a new random symmetric key based on the number of bytes specified.
     *
     * @param nrOfBytes the random length of the key
     * @returns {*} a random symmetric key base64 encoded used as symmetric key
     */
    createRandomSymmetricKeyString: function (nrOfBytes) {
        if (!nrOfBytes) {
            nrOfBytes = 128; //Default is 128
        }
        return crypto.randomBytes(nrOfBytes).toString('base64');
    }
}
