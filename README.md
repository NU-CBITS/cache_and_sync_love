# Cache and Sync Love

## Intended use

This was specifically designed for use in hybrid mobile applications, and is
aimed at mobile browsers.

## Compatibility

The Lovefield library works with Chrome >= 37, Firefox >= 31, IE >= 10, and
Safari >= 5.1. However, it uses WebSQL in Safari instead of IndexedDB due to
implementation bugs.

`Promise` is supported by Android Webview, Firefox Mobile >= 29.0, Safari
Mobile >= 8, and Chrome for Android >= 32.0.

For broad support, it is recommended that you use either the Crosswalk library
or the [ES2015 Promise polyfill](https://github.com/jakearchibald/es6-promise).

## Development

To build the distribution version, run

```
npm run build
```

It will create the minified file `dist/cache_and_sync_love.min.js`.
