/**
 * Consent schema
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var security = require('../utils/security/securityhelper');

/**
 * A consent is required to allow another user to access own data items.
 * To do so, the encryption key of the sending user is encrypted with the public key of the receiving user,
 * so that only the receiving user can decrypt it using his or her private key
 */
var ConsentSchema = new Schema({
    sender: {
        type: String,
        required: true
    }, //username of the person giving the consent for her/his data
    receiver: {
        type: String,
        required: true
    }, //username of the person getting the consent for the other user's data
    encryptionKeyEnc: {
        type: String,
        required: true
    } //Encrypted encryption key used to decrypt the other users data. Encrypted with public key of the receiver
});

//Make sure the consent can only exist once for each sender and receiver
//ConsentSchema.index({sender: 1, receiver: 1}, {unique: true});

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
    //the person granting the consent
    this.sender = sender;
    // the person being able to read data
    this.receiver = receiver;
    // the encrypted encryption key of sender, encrypted with the public key of receiver
    this.encryptionKeyEnc = encryptionKeyEnc;
    this.save(saveFunction);
};

module.exports = mongoose.model('Consent', ConsentSchema);
