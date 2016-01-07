# Cache and Sync Love

## Installation

This library is available via a
[GitHub repository](https://github.com/NU-CBITS/cache_and_sync_love), but it can
be installed with `npm` as well

```
npm i --save cache_and_sync_love
```

This will add it as a dependency to your `package.json` file and add it plus its
dependencies to the `node_modules` folder.

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

It will create both the beautified and the minified files
`dist/cache_and_sync_love[.min].js`.

To publish, once all changes have been committed, run

```
npm version <type>
npm publish
```

See the documentation for `npm version` with

```
npm help version
```
