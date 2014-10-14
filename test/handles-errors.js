var test = require('tape');

var createLogger = require('./lib/create-logger.js');

test('can .error(new Error())', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.message,
            'Error: handles-errors.js: lulz');

        assert.equal(result.culprit,
            'handles-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'handles-errors.js: lulz'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error(new Error('lulz'));
    }

    logError();
});

test('can .error("message", new Error())', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.message,
            'Error: handles-errors.js: no u');

        assert.equal(result.culprit,
            'handles-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'handles-errors.js: no u'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('hello world', new Error('no u'));
    }

    logError();
});

test('has originalMessage for .error(str, errObj)', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.extra.originalMessage,
            'original message');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('original message',
            new Error('some error'));
    }

    logError();
});

test('has errLoc in .error(str, errObj)', function (assert) {
    var logger = createLogger(function (result) {
        assert.notEqual(
            result.message.indexOf('handles-errors.js:'), -1);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', new Error('foo'));
    }

    logError();
});

test('.error(str, metaObj) has a stack extra', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.extra.oh, 'hi');
        assert.ok(result.extra.stack);

        assert.equal(result.message,
            'handles-errors.js: some message');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', { oh: 'hi' });
    }

    logError();
});

test('respects tags defined in logger', function (assert) {
    var logger = createLogger({
        tags: {
            regionName: 'hello'
        }
    }, function (result) {
        assert.equal(result.tags.regionName, 'hello');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', new Error('some error'));
    }

    logError();
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.extra.other, 'key');
        assert.equal(result.extra.originalMessage, 'some message');

        assert.equal(result.message,
            'Error: handles-errors.js: some error');

        assert.equal(result.culprit,
            'handles-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'handles-errors.js: some error'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', {
            error: new Error('some error'),
            other: 'key'
        });
    }

    logError();
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.extra.other, 'key');
        assert.equal(result.extra.originalMessage, 'some message');

        assert.equal(result.message,
            'Error: handles-errors.js: some error');

        assert.equal(result.culprit,
            'handles-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'handles-errors.js: some error'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);
        assert.equal(result.extra.arbitraryKey, undefined);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', {
            arbitraryKey: new Error('some error'),
            other: 'key'
        });
    }

    logError();
});

test('passes pid as a prop', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.tags.pid, process.pid);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', new Error('some error'));
    }

    logError();
});

test('passes node as tags to server', function (assert) {
    var logger = createLogger(function (result) {
        assert.equal(result.tags.nodeVersion, process.version);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', new Error('some error'));
    }

    logError();
});
