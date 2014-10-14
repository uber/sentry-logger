var zlib = require('zlib');
var format = require('util').format;

/*  script to test sending messages to sentry
    should only be used to test artifacts in the sentry GUI
*/

var SentryLogger = require('../index.js');

// ssh -L 8080:sentry.my.company:80 my-server
var DSN = 'http://{projectId}:' +
    '{password}@' +
    'localhost:8080/68';

var logger = SentryLogger({
    dsn: DSN,
    tags: { regionName: 'my_region' },
    onRavenError: onRavenError
});

function sendError() {
    // var error = new Error('some message13');

    logger.log('{level}', 'test message20', {
        'oh': 'hi'
    }, function () {
        console.log('flushed', arguments);
    });
}

sendError();

function onRavenError(e) {
    var message = new Buffer(String(e.sendMessage || ''), 'base64');

    zlib.inflate(message, function (err, buff) {
        var sendMessage = String(buff || '');

        console.warn('Raven failed to upload to Sentry: ', {
            message: e.message,
            stack: e.stack,
            reason: e.reason,
            statusCode: e.statusCode,
            sendMessage: sendMessage,
            headers: e.response && e.response.headers
        });
        console.info(
            format('could not log "%s" to raven', sendMessage));
    });
}
