var test = require('tape');
var Request = require('hammock/request');

var createLogger = require('./lib/create-logger.js');

test('logger.error(msg, { req: req })', function (assert) {
    var logger = createLogger(function (result) {

        assert.ok(result['sentry.interfaces.Stacktrace']);
        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'supports-http.js: bar'
        });
        assert.equal(result.message,
            'Error: supports-http.js: bar');

        var req = result['sentry.interfaces.Http'];
        assert.ok(req);
        assert.equal(req.url, 'http://foo.com/foo');
        assert.equal(req.method, 'GET');
        assert.equal(req.headers.host, 'foo.com');


        assert.equal(result.extra.req, undefined);

        logger.destroy();
        assert.end();
    });

    function logError() {
        var req = Request({
            url: '/foo',
            headers: {
                host: 'foo.com'
            }
        });
        // work around https://github.com/tommymessbauer/hammock/pull/9
        req.socket = req.connection;

        logger.error('foo', {
            error: new Error('bar'),
            req: req
        });
    }

    logError();
});

test('logger.error(msg, { anyKey: req })', function (assert) {
    var logger = createLogger(function (result) {

        assert.ok(result['sentry.interfaces.Stacktrace']);
        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'supports-http.js: bar'
        });
        assert.equal(result.message,
            'Error: supports-http.js: bar');

        var req = result['sentry.interfaces.Http'];
        assert.ok(req);
        assert.equal(req.url, 'http://foo.com/foo');
        assert.equal(req.method, 'GET');
        assert.equal(req.headers.host, 'foo.com');


        assert.equal(result.extra.anyKey, undefined);

        logger.destroy();
        assert.end();
    });

    function logError() {
        var req = Request({
            url: '/foo',
            headers: {
                host: 'foo.com'
            }
        });
        // work around https://github.com/tommymessbauer/hammock/pull/9
        req.socket = req.connection;

        logger.error('foo', {
            error: new Error('bar'),
            anyKey: req
        });
    }

    logError();
});
