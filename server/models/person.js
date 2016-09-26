var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var security = require('../utils/security/securityhelper');


/**
 * Schema definition for a new user. It's not the same as the Account used to authenticate
 * (although the username is the same in both cases).
 * The fields are explained in the @see storeUser function, see PersonSchema#storeUser
 */
var PersonSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }, // username is the same as in the account
    publicKey: {
        type: String,
        required: true
    }, //Public key of the PKI
    privateKeyEnc: {
        type: String,
        required: true
    }, //Encrypted private key of the PKI, encrypted using password (symmetric encryption currently)
    encryptionKeyEnc: {
        type: String,
        required: true
    }, //Encrypted encryption key used to encrypt data, encrypted using the public key
    spirometryData: [String]  // measurements
});
/**
 * Creates a new Person object using username and password (cleartext) and stores it in the MongoDB.
 * Creates all required keys (Public/Private keys for exchange, encryptionKey for encrypting data)
 * This is a static function to be invoked on the schema.
 * @param username to match the user against the username of the account.
 * @param password the password provided on log in. clear text. used to encrypt the private key.
 * @param saveFunction actions to be taken after the new user was stored
 *
 *
 */
PersonSchema.methods.storeUser = function (username, password, saveFunction) {
    //Assign the username
    this.username = username;
    //Create the new public and private keys
    var keyPair = security.createKeyPair();
    //Store the public key without encrypting
    this.publicKey = keyPair.publicKey;
    //Encrypt the private key with the password
    this.privateKeyEnc = security.symmetricEncrypt(keyPair.privateKey, password);
    //Create a new random symmetric key of length 128
    var encryptionKey = security.createRandomSymmetricKeyString();
    //Encrypt the encryption key using the public key
    this.encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, keyPair.publicKey);
    this.save(saveFunction);
}


module.exports = mongoose.model('Person', PersonSchema);



