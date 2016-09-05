var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Person = new Schema({
    username: String,
    publicKey: String, //Public key of the PKI
    privateKeyEnc: String, //Encrypted private key of the PKI, encrypted using password (symmetric encryption currently)
    encryptionKeyEnc: String, //Encrypted encryption key used to encrypt data, encrypted using the public key
    spirometryData: [String]  // measurements
});



module.exports = mongoose.model('Person', Person);

