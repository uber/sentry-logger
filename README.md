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

## License (MIT)

Copyright (C) 2013 by Uber Technologies, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

