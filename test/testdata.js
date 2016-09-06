var request = require('supertest');
var http = require('http');

describe('loading express', function () {
    var server;
    beforeEach(function () {
        delete require.cache[require.resolve('../app')]; //needed to have a clear server with every unit test
        var app = require('../app');
        server = http .createServer(app);
        server.listen(8080);
    });
    afterEach(function (done) {
        server.close(done);
    });
    it('responds to /data/', function testSlash(done) {
        request(server)
            .get('/data')
            .expect(200, done);
    });
});