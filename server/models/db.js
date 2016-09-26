module.exports = {
    /**
     * used to start a new mongodb connection. Refactored to be used in tests
     * @param config specifies the address and name of the mongodb
     */
    getDB: function (config) {
        // connect db - required the mongo db to be started mongoose
        var mongoose = require('mongoose');
        if (mongoose.connection.readyState == 0) {
            mongoose.connect(config);
        }

        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            console.log("We are connected!");
        });
    }
}
;