var Logger = require('winston-uber').Logger;

var SentryServer = require('./sentry-server.js');
var SentryLogger = require('../../index.js');

module.exports = createLogger;

function createLogger(opts, listener) {
    if (typeof opts === 'function') {
        listener = opts;
        opts = {};
    }

    var server;

    opts = opts || {};

    if (!opts.dsn) {
        server = SentryServer(listener);
        opts.dsn = server.dsn;
    }

    var sLogger = new SentryLogger(opts);
    var logger = new Logger({
        transports: [ sLogger ]
    });

    logger.destroy = function () {
        if (server) {
            server.close();
        }
    };

    return logger;
}
