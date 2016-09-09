var session = require('supertest-session');

var http = require('http');

describe('loading express', function () {

    var testSession;
    beforeEach(function () {
        delete require.cache[require.resolve('../app')]; //needed to have a clear server with every unit test
        var app = require('../app');
        server = http.createServer(app);
        server.listen(3000);

        testSession = session(app, {
            before: function (req) {
                req.set('user.username', 'o1');
                req.set('session.encryptionKey', 'ApfFAu6elmmxk51eWUz+I5JVn4XuJUTo8X8iTDG/S6FpVRiBElvNBg96M2MOON5xba6VX4mMfrqTEyoNH32W9dtL0E/J/CQ1vMUANSi1kINXGlrEE3hJZkGwpnN20UXpDvSsxzrVK3B+R5mIc6cut+w2pZ2VisFRN5HAvPItjM4=')
            }
        });
    });
    afterEach(function (done) {
        server.close(done);
    });
    it('responds to /data/', function(done) {
        testSession
            .get('/data/showdata/o1')
            .expect(302 )
            .end(done);
    });
});