# winston-sentry

A [sentry]() transport for [winston]()

## Usage

```js
var winston = require('winston');

winston.transports.Sentry = require('winston-sentry');

winston.add(winston.transports.Sentry, options);
```

The Sentry transport takes the following options:

* `enabled` - Flag for explicitly enabling or disabling the transport (enabled by default).
* `dsn` - The dsn URL the sentry client uses to connect to Sentry.

## Install

```sh
npm install winston winston-sentry
```

## Testing

The tests assume you have a sentry server running on the default port on localhost. Work to mock sentry for the tests is ongoing. Tests are run with a simple:

```sh
npm test
```

## MIT Licensed
