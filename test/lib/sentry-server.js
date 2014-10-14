var body = require('body');
var http = require('http');
var zlib = require('zlib');

module.exports = SentryServer;

function SentryServer(listener) {
    var PORT = 20000 + Math.round(Math.random() * 10000);
    var dsn = 'http://public:private@localhost:' + PORT + '/9';

    var server = http.createServer(function (req, res) {
        body(req, res, function (err, body) {
            if (err) {
                server.emit('error', err);
            }

            var message = new Buffer(String(body), 'base64');
            zlib.inflate(message, function (err, buf) {
                if (err) {
                    server.emit('error', err);
                }

                var result = JSON.parse(String(buf));

                listener(result);
            });

            res.end();
        });
    });
    server.listen(PORT);

    server.dsn = dsn;

    return server;
}
