zalgo-promise
-------------

[![build status][build-badge]][build]
[![code coverage][coverage-badge]][coverage]
[![npm version][version-badge]][package]

[build-badge]: https://img.shields.io/github/workflow/status/krakenjs/zalgo-promise/build?logo=github&style=flat-square
[build]: https://github.com/krakenjs/zalgo-promise/actions?query=workflow%3Abuild
[coverage-badge]: https://img.shields.io/codecov/c/github/krakenjs/zalgo-promise.svg?style=flat-square
[coverage]: https://codecov.io/github/krakenjs/zalgo-promise/
[version-badge]: https://img.shields.io/npm/v/zalgo-promise.svg?style=flat-square
[package]: https://www.npmjs.com/package/zalgo-promise

A promise library that does not automatically resolve promises asynchronously, unless you do so manually.

https://medium.com/@bluepnume/intentionally-unleashing-zalgo-with-promises-ab3f63ead2fd

### Quick Start

`npm install --save zalgo-promise`

#### Global

```javascript
<script src="zalgo-promise.js"></script>
<script>
    new ZalgoPromise( ... );
</script>
```

#### CommonJS

```javascript
var ZalgoPromise = require('zalgo-promise');

new ZalgoPromise( ... );
```

#### ES6

```javascript
import { ZalgoPromise } from 'zalgo-promise';

new ZalgoPromise( ... );
```

### Rationale

Promises are asynchronous by default. This means that:

```javascript
Promise.resolve('foo').then(function(result) {
    console.log(result);
});

console.log('bar');
```

Will log:

```javascript
bar
foo
```

Even if we don't do anything explicitly asynchronous in the promise, it becomes asynchronous by default.

This is, generally speaking, a good thing™

However, this is a problem when:

- You're using a browser which doesn't have native Promise support
- You're using a Promise shim, which has to use `setTimeout()` to guarantee promises are resolved asynchronously
- You need to deal with cases where the browser deprioritizes `setTimeout()`, for instance, you're in a popup window but still want to communicate with the parent window

In this case, any promises you run in the unfocused window will try to run `setTimeout()`, the browser will deprioritize those calls, and your code will hang.

ZalgoPromise attempts to resolve this problem by introducing promises which are not asynchronous by default, only if you explicitly do something asynchronous like an ajax call, a post-message, a setTimeout or something else.

```javascript
var promise = new ZalgoPromise(function(resolve) {
    resolve();
});

promise.then(function() {
    // This function will be called *synchronously*
});
```

```javascript
var promise = new ZalgoPromise(function(resolve) {
    setTimeout(resolve, 100);
});

promise.then(function() {
    // This function will be called *asynchronously*
});
```
