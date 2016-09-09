/**
 * Consent schema
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var security = require('../security/securityhelper');

var ConsentSchema = new Schema({
    sender: String, //username of the person giving the consent for her/his data
    receiver: String, //username of the person getting the consent for the other user's data
    encryptionKeyEnc: String //Encrypted encryption key used to decrypt the other users data. Encrypted with public key of the receiver
});


/**
 * Creates a new consent. This means that receiver is able to read the data of sender.
 * @param sender the user granting access to own data
 * @param receiver the user granted to access the data of sender
 * @param encryptionKey the key to decrypt the data of the sender
 * @param publicKey the public key of the receiver to encrypt the sender's encryption key
 * @param saveFunction function called when the consent is saved. parameters are: (err, consent)
 */
ConsentSchema.methods.createConsent = function (sender, receiver, encryptionKey, publicKey, saveFunction) {
    //encrypt the user's encryption key with the public key of the receiver
    var encryptionKeyEnc = security.encryptStringWithRsaPublicKey(encryptionKey, publicKey);
    this.sender = sender; //the person granting the consent
    this.receiver = receiver; // the person being able to read data
    this.encryptionKeyEnc = encryptionKeyEnc; // the encrypted encryption key of sender, encrypted with the public key of receiver
    this.save(saveFunction);
};

module.exports = mongoose.model('Consent', ConsentSchema);
