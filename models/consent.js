/**
 * Consent schema
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Consent = new Schema({
    sender: String, //username of the person giving the consent for her/his data
    receiver: String, //username of the person getting the consent for the other user's data
    encryptionKeyEnc: String //Encrypted encryption key used to decrypt the other users data. Encrypted with public key of the receiver
});


module.exports = mongoose.model('Consent', Consent);
