type WinstonTransport := {
    log: (level: String, msg: String, meta: Object, callback: Callback<>)
}

type RavenClient := EventEmitter & {
    captureError: (err: Error, callback: Callback<>),
    captureMessage: (msg: String, meta: Object, callback: Callback<>)
}

type Prober := {
    probe: (thunk: (Callback<>) => void) => void
}

winston-sentry := ({
    level?: String,
    enabled?: Boolean,
    dsn: String,
    tags?: Object,
    onRavenError?: Function,
    ravenClient: RavenClient,
    sentryProber?: Prober
}) => WinstonTransport
