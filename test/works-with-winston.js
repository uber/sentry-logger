var test = require('tape');
var Logger = require('winston-uber').Logger;

var SentryLogger = require('../');

function fakeRavenClient(listener) {
    return {
        captureError: function (err, meta, cb) {
            listener('error', err);
            if (cb) cb();
        },
        captureMessage: function (msg, meta, cb) {
            listener('message', msg, meta);
            if (cb) cb();
        },
        on: function () {}
    };
}

test('SentryLogger error msg formatting', function (assert) {
    var messages = [];
    var sLogger = new SentryLogger({
        ravenClient: fakeRavenClient(function () {
            messages.push([].slice.call(arguments));
        })
    });

    var logger = new Logger({
        transports: [ sLogger ]
    });

    logger.error('oops');

    assert.equal(messages[0][1], 'works-with-winston.js: oops');

    assert.end();
});

test('SentryLogger can build own trace', function (assert) {
    var messages = [];
    var logger = new SentryLogger({
        ravenClient: fakeRavenClient(function () {
            messages.push([].slice.call(arguments));
        }),
        computeErrLoc: function (msg) {
            var line = new Error(msg).stack.split('\n')[3];
            var errLoc = line ?
                line.replace(/^\s*at .*\/([^\:\/]*).*$/, "$1") : '';

            return errLoc;
        }
    });

    logger.log('error', 'oops');

    assert.equal(messages[0][1], 'works-with-winston.js: oops');

    assert.end();
});
