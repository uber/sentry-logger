var http = require('http');
var test = require('tape');

var SentryLogger = require('../');

function fakeProber(listener) {
    return {
        probe: function (thunk) {
            listener('thunk');
            thunk();
        }
    };
}

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


var PORT = 20000 + Math.round(Math.random() * 10000);
var dsn = 'http://public:private@localhost:' + PORT + '/269';

test('SentryLogger can log messages', function (assert) {
    var messages = [];
    var logger = new SentryLogger({
        ravenClient: fakeRavenClient(function (type, msg, meta) {
            messages.push([type, msg, meta]);
        })
    });

    logger.log('warn', 'hello');
    logger.log('error', 'oops');

    assert.equal(messages[0][0], 'message');
    assert.equal(messages[1][0], 'message');
    assert.notEqual(messages[0][1].indexOf('hello'), -1);
    assert.notEqual(messages[1][1].indexOf('oops'), -1);
    assert.equal(messages.length, 2);

    assert.end();
});

test('SentryLogger handles non-object meta', function (assert) {
    var messages = [];
    var logger = new SentryLogger({
        ravenClient: fakeRavenClient(function (type, msg, meta) {
            messages.push([type, msg, meta]);
        })
    });

    logger.log('error', new Error('oh noes'), 'string meta');

    assert.equal(messages[0][0], 'error');
    assert.equal(messages[0][1].message, ': oh noes');
    assert.equal(messages.length, 1);

    assert.end();
});

test('SentryLogger handles errors differently', function (assert) {
    var messages = [];
    var logger = new SentryLogger({
        ravenClient: fakeRavenClient(function (type, msg, meta) {
            messages.push([type, msg, meta]);
        })
    });

    logger.log('error', new Error('oh noes'));

    assert.equal(messages[0][0], 'error');
    assert.equal(messages[0][1].message, ': oh noes');
    assert.equal(messages.length, 1);

    assert.end();
});

test('SentryLogger writes to a prober', function (assert) {
    var messages = [];
    var probes = [];
    var logger = new SentryLogger({
        ravenClient: fakeRavenClient(function (type, msg, meta) {
            messages.push([type, msg, meta]);
        }),
        sentryProber: fakeProber(function (type) {
            probes.push(type);
        })
    });

    logger.log('info', 'oh hai', {}, function () {});
    logger.log('error', new Error('oops'), {}, function () {});

    assert.equal(messages.length, 2);
    assert.equal(probes.length, 2);

    assert.deepEqual(probes, ['thunk', 'thunk']);
    assert.equal(messages[0][0], 'message');
    assert.notEqual(messages[0][1].indexOf('oh hai'), -1);
    assert.equal(messages[1][0], 'error');
    assert.equal(messages[1][1].message, ': oops');

    assert.end();
});

test('SentryLogger makes HTTP requests to a sentry server', function (assert) {
    var server = http.createServer(function (req, res) {
        var uri = req.url;

        res.end();
        assert.equal(uri, '/api/269/store/');

        server.close();
        assert.end();
    });
    server.listen(PORT);

    var logger = new SentryLogger({
        dsn: dsn
    });

    logger.log('info', 'oh hai');
});
