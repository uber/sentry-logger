var util = require('util');
var winston = require('winston-uber');
var raven = require('raven');
var ravenParsers = require('raven/lib/parsers.js');
var extend = require('xtend');
var stringify = require('json-stringify-safe');
var isError = require('core-util-is').isError;

var CIRCULAR_STRING = '[Circular';

function computeErrLoc(msg) {
    var line = new Error(msg).stack.split('\n')[10];
    var errLoc = line ?
        line.replace(/^\s*at .*\/([^\:\/]*).*$/, "$1") : '';

    return errLoc;
}

function SentryLogger(options) {
    if (!(this instanceof SentryLogger)) {
        return new SentryLogger(options);
    }

    winston.Transport.call(this, options);
    this.name = 'SentryLogger';
    this.level = options.level || 'error';
    this.enabled = typeof(options.enabled) === 'boolean' ?
        options.enabled : true;
    this.dsn = options.dsn;
    this.defaultTags = options.tags || {};
    this.computeErrLoc = options.computeErrLoc || computeErrLoc;

    if (!this.defaultTags.pid) {
        this.defaultTags.pid = process.pid;
    }

    var ravenErrorHandler = typeof options.onRavenError === 'function' ?
        options.onRavenError : function (e) {
            // do not warn() on 429 errors
            if (e.message.indexOf('429') >= 0) {
                return;
            }

            winston.warn('Raven failed to upload to Sentry: ', {
                message: e.message,
                stack: e.stack,
                reason: e.reason,
                statusCode: e.statusCode
            });
        };

    if (!this.dsn && !options.ravenClient) {
        throw new Error('Cannot construct a Sentry transport without a DSN');
    }
    this.ravenClient = options.ravenClient ||
        new raven.Client(this.enabled && this.dsn);
    this.ravenClient.loggerName = 'SentryLogger';
    // Unsure how statsd could integrate with this due to ubiquity of the logger
    // and no initialization function for winston transports
    this.ravenClient.on('error', ravenErrorHandler);

    this.captureError = this.ravenClient.captureError.bind(this.ravenClient);
    this.captureMessage = this.ravenClient.captureMessage
        .bind(this.ravenClient);
    this.sentryProber = options.sentryProber || null;
    this.sentryProberCallbackImmediately = !options.sentryProberDetectFailuresBy;
    this.sentryProberDetectFailuresByCallback = options.sentryProberDetectFailuresBy === SentryLogger.detectBy.CALLBACK;
    this.sentryProberDetectFailuresByEvent = options.sentryProberDetectFailuresBy === SentryLogger.detectBy.EVENT;
    this.sentryProberDetectFailuresByEventSuccessEvent = options.sentryProberDetectFailuresByEventSuccessEvent;
    this.sentryProberDetectFailuresByEventFailureEvent = options.sentryProberDetectFailuresByEventFailureEvent;
}

SentryLogger.detectBy = {
    CALLBACK: 'callback',
    EVENT: 'event'
};

util.inherits(SentryLogger, winston.Transport);

SentryLogger.prototype.name = 'SentryLogger';

SentryLogger.prototype.log = function(level, msg, meta, callback) {
    var thunk;

    if (!meta || typeof meta !== 'object') {
        meta = {};
    }
    // store original meta because we might serialize it
    var originalMeta = meta;
    var stringMeta = stringify(meta);

    // To avoid sending circular data to sentry we check
    // whether its circular using json-stringify-safe and then
    // stringify(parse(meta)) to make it not circular
    meta = stringMeta.indexOf(CIRCULAR_STRING) !== -1 ?
        JSON.parse(stringMeta) : meta;

    var sentryArgs = {
        extra: meta,
        tags: extend(this.defaultTags, meta.tags || {})
    };

    if (meta.tags) {
        delete meta.tags;
    }

    if (!sentryArgs.tags.nodeVersion) {
        sentryArgs.tags.nodeVersion = process.version;
    }

    // if we have an error in the meta object we want to
    // serialize it in a sentry friendly way
    var metaTuple = containsError(originalMeta);
    if (metaTuple) {
        sentryArgs.extra.originalMessage = msg;

        if (metaTuple.key) {
            delete sentryArgs.extra[metaTuple.key];
        }

        msg = metaTuple.value;
    }

    // if we have a req in the meta object we want to
    // use sentry's HTTP request serializer to pretty print the
    // http Request rather then sending the raw representation
    var reqTuple = containsRequest(originalMeta);
    if (reqTuple) {
        var req = ravenParsers .parseRequest(reqTuple.value)
            ['sentry.interfaces.Http'];
        req.env = { REMOTE_ADDR: req.env.REMOTE_ADDR };
        sentryArgs['sentry.interfaces.Http'] = req;

        if (reqTuple.key) {
            delete sentryArgs.extra[reqTuple.key];
        }
    }

    var errLoc;

    if(this.sentryProber && this.sentryProberDetectFailuresByEvent) {
        var proberSignaled = false;
        this.ravenClient.once(
            this.sentryProberDetectFailuresByEventFailureEvent || 'error',
            function onProberFailure() {
                if (proberSignaled) {
                    return;
                }
                proberSignaled = true;

                // We swallow this and callback with a success case
                // because sentry failures are warned by ravenErrorHandler instead.
                // Theoretically this is "incorrect" wrt the "detectFailuresByEvent" api,
                // but since this library swallowed errors for so long when you supplied a sentryProber,
                // we should continue to only warn and not raise an error.
                // callback(err || new Error('Sentry Prober emitted failure event.'));
                callback(null, true);
            }
        );
        this.ravenClient.once(
            this.sentryProberDetectFailuresByEventSuccessEvent || 'logged',
            function onProberSuccess(message) {
                if (proberSignaled) {
                    return;
                }
                proberSignaled = true;

                callback(null, message || true);
            }
        );
    }

    if (isError(msg)) {
        errLoc = this.computeErrLoc(msg.message);
        msg.message = errLoc + ": " + msg.message;

        if (this.sentryProber) {
            thunk = this.captureError.bind(null, msg, sentryArgs);
            this.sentryProber.probe(thunk, this.sentryProberDetectFailuresByCallback ? callback : null);
        } else {
            this.captureError(msg, sentryArgs, callback);
        }
    } else {
        // winston adds in 9 stacks of function calls between the
        // actual .log() call location
        errLoc = this.computeErrLoc(msg);

        if (!sentryArgs.extra.stack) {
            sentryArgs.extra.stack = new Error('stack').stack;
        }

        if (this.sentryProber) {
            thunk = this.captureMessage
                .bind(null, errLoc + ": " + msg, sentryArgs);
            this.sentryProber.probe(thunk, this.sentryProberDetectFailuresByCallback ? callback : null);
        } else {
            this.captureMessage(errLoc + ": " + msg, sentryArgs, callback);
        }
    }

    if (this.sentryProber && this.sentryProberCallbackImmediately) {
        callback(null, true);
    }
};

module.exports = SentryLogger;

function containsError(obj) {
    if (isError(obj)) {
        return { key: null, value: obj };
    }

    var error = null;
    Object.keys(obj).some(function (key) {
        if (isError(obj[key])) {
            error = { key: key, value: obj[key] };
            return true;
        }
    });

    return error;
}

function containsRequest(obj) {
    var req = null;
    Object.keys(obj).some(function (key) {
        if (isRequest(obj[key])) {
            req = { key: key, value: obj[key] };
            return true;
        }
    });

    return req;
}

function isRequest(req) {
    return req &&
        typeof req.headers === 'object' &&
        typeof req.method === 'string' &&
        typeof req.url === 'string' &&
        typeof req.on === 'function';
}
