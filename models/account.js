var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

/***
 * Account used for local strategy
 */
var Account = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String
    }
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);