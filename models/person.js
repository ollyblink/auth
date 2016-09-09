var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var security = require('../security/securityhelper');

/**
 * Schema definition for a new user. It's not the same as the Account used to authenticate
 * (although the username is the same in both cases).
 */
var PersonSchema = new Schema({
    username: String, // username is the same as in the account
    publicKey: String, //Public key of the PKI
    privateKeyEnc: String, //Encrypted private key of the PKI, encrypted using password (symmetric encryption currently)
    encryptionKeyEnc: String, //Encrypted encryption key used to encrypt data, encrypted using the public key
    spirometryData: [String]  // measurements
});
/**
 * Creates a new Person object using username and password (cleartext) and stores it in the MongoDB.
 * Creates all required keys (Public/Private keys for exchange, encryptionKey for encrypting data)
 * This is a static function to be invoked on the schema.
 * @param username to match the user against the username of the account.
 * @param password the password provided on log in. clear text. used to encrypt the private key.
 *
 * @returns a new person object to be stored in the MongoDB
 */
PersonSchema.methods.storeUser = function (username, password, saveFunction) {
    var keyPair = security.createKeyPair();
    var privateKeyEnc = security.symmetricEncrypt(keyPair.privateKey, password);
    var encryptionKey = security.createRandomSymmetricKeyString();
    var encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, keyPair.publicKey);

    this.username = username;
    this.publicKey = keyPair.publicKey;
    this.privateKeyEnc = privateKeyEnc;
    this.encryptionKeyEnc = encryptionKeyEnc;

    this.save(saveFunction);
}


module.exports = mongoose.model('Person', PersonSchema);



