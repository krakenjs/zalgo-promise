function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { isPromise as _isPromise } from './utils';
import { onPossiblyUnhandledException as _onPossiblyUnhandledException, dispatchPossiblyUnhandledError } from './exceptions';
import { startActive, endActive, awaitActive } from './flush';

var ZalgoPromise = function () {
    function ZalgoPromise(handler) {
        var _this = this;

        _classCallCheck(this, ZalgoPromise);

        this.resolved = false;
        this.rejected = false;
        this.errorHandled = false;

        this.handlers = [];

        if (handler) {

            var _result = void 0;
            var _error = void 0;
            var resolved = false;
            var rejected = false;
            var isAsync = false;

            startActive();

            try {
                handler(function (res) {
                    if (isAsync) {
                        _this.resolve(res);
                    } else {
                        resolved = true;
                        _result = res;
                    }
                }, function (err) {
                    if (isAsync) {
                        _this.reject(err);
                    } else {
                        rejected = true;
                        _error = err;
                    }
                });
            } catch (err) {
                endActive();
                this.reject(err);
                return;
            }

            endActive();

            isAsync = true;

            if (resolved) {
                // $FlowFixMe
                this.resolve(_result);
            } else if (rejected) {
                this.reject(_error);
            }
        }

        if (__DEBUG__) {
            try {
                throw new Error('ZalgoPromise');
            } catch (err) {
                this.stack = err.stack;
            }
        }
    }

    ZalgoPromise.prototype.resolve = function resolve(result) {
        if (this.resolved || this.rejected) {
            return this;
        }

        if (_isPromise(result)) {
            throw new Error('Can not resolve promise with another promise');
        }

        this.resolved = true;
        this.value = result;
        this.dispatch();

        return this;
    };

    ZalgoPromise.prototype.reject = function reject(error) {
        var _this2 = this;

        if (this.resolved || this.rejected) {
            return this;
        }

        if (_isPromise(error)) {
            throw new Error('Can not reject promise with another promise');
        }

        if (!error) {
            // $FlowFixMe
            var _err = error && typeof error.toString === 'function' ? error.toString() : Object.prototype.toString.call(error);
            error = new Error('Expected reject to be called with Error, got ' + _err);
        }

        this.rejected = true;
        this.error = error;

        if (!this.errorHandled) {
            setTimeout(function () {
                if (!_this2.errorHandled) {
                    dispatchPossiblyUnhandledError(error, _this2);
                }
            }, 1);
        }

        this.dispatch();

        return this;
    };

    ZalgoPromise.prototype.asyncReject = function asyncReject(error) {
        this.errorHandled = true;
        this.reject(error);
        return this;
    };

    ZalgoPromise.prototype.dispatch = function dispatch() {
        var dispatching = this.dispatching,
            resolved = this.resolved,
            rejected = this.rejected,
            handlers = this.handlers;


        if (dispatching) {
            return;
        }

        if (!resolved && !rejected) {
            return;
        }

        this.dispatching = true;
        startActive();

        var chain = function chain(firstPromise, secondPromise) {
            return firstPromise.then(function (res) {
                secondPromise.resolve(res);
            }, function (err) {
                secondPromise.reject(err);
            });
        };

        for (var i = 0; i < handlers.length; i++) {
            var _handlers$i = handlers[i],
                _onSuccess = _handlers$i.onSuccess,
                _onError = _handlers$i.onError,
                _promise = _handlers$i.promise;


            var _result2 = void 0;

            if (resolved) {

                try {
                    _result2 = _onSuccess ? _onSuccess(this.value) : this.value;
                } catch (err) {
                    _promise.reject(err);
                    continue;
                }
            } else if (rejected) {

                if (!_onError) {
                    _promise.reject(this.error);
                    continue;
                }

                try {
                    _result2 = _onError(this.error);
                } catch (err) {
                    _promise.reject(err);
                    continue;
                }
            }

            if (_result2 instanceof ZalgoPromise && (_result2.resolved || _result2.rejected)) {

                if (_result2.resolved) {
                    _promise.resolve(_result2.value);
                } else {
                    _promise.reject(_result2.error);
                }

                _result2.errorHandled = true;
            } else if (_isPromise(_result2)) {

                if (_result2 instanceof ZalgoPromise && (_result2.resolved || _result2.rejected)) {
                    if (_result2.resolved) {
                        _promise.resolve(_result2.value);
                    } else {
                        _promise.reject(_result2.error);
                    }
                } else {
                    // $FlowFixMe
                    chain(_result2, _promise);
                }
            } else {

                _promise.resolve(_result2);
            }
        }

        handlers.length = 0;
        this.dispatching = false;
        endActive();
    };

    ZalgoPromise.prototype.then = function then(onSuccess, onError) {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        var promise = new ZalgoPromise();

        this.handlers.push({
            promise: promise,
            onSuccess: onSuccess,
            onError: onError
        });

        this.errorHandled = true;

        this.dispatch();

        return promise;
    };

    ZalgoPromise.prototype['catch'] = function _catch(onError) {
        return this.then(undefined, onError);
    };

    ZalgoPromise.prototype['finally'] = function _finally(onFinally) {

        if (onFinally && typeof onFinally !== 'function' && !onFinally.call) {
            throw new Error('Promise.finally expected a function');
        }

        return this.then(function (result) {
            return ZalgoPromise['try'](onFinally).then(function () {
                return result;
            });
        }, function (err) {
            return ZalgoPromise['try'](onFinally).then(function () {
                throw err;
            });
        });
    };

    ZalgoPromise.prototype.timeout = function timeout(time, err) {
        var _this3 = this;

        if (this.resolved || this.rejected) {
            return this;
        }

        var timeout = setTimeout(function () {

            if (_this3.resolved || _this3.rejected) {
                return;
            }

            _this3.reject(err || new Error('Promise timed out after ' + time + 'ms'));
        }, time);

        return this.then(function (result) {
            clearTimeout(timeout);
            return result;
        });
    };

    // $FlowFixMe


    ZalgoPromise.prototype.toPromise = function toPromise() {
        // $FlowFixMe
        if (typeof Promise === 'undefined') {
            throw new TypeError('Could not find Promise');
        }
        // $FlowFixMe
        return Promise.resolve(this); // eslint-disable-line compat/compat
    };

    ZalgoPromise.resolve = function resolve(value) {

        if (value instanceof ZalgoPromise) {
            return value;
        }

        if (_isPromise(value)) {
            // $FlowFixMe
            return new ZalgoPromise(function (resolve, reject) {
                return value.then(resolve, reject);
            });
        }

        return new ZalgoPromise().resolve(value);
    };

    ZalgoPromise.reject = function reject(error) {
        return new ZalgoPromise().reject(error);
    };

    ZalgoPromise.asyncReject = function asyncReject(error) {
        return new ZalgoPromise().asyncReject(error);
    };

    ZalgoPromise.all = function all(promises) {
        // eslint-disable-line no-undef

        var promise = new ZalgoPromise();
        var count = promises.length;
        var results = [];

        if (!count) {
            promise.resolve(results);
            return promise;
        }

        var chain = function chain(i, firstPromise, secondPromise) {
            return firstPromise.then(function (res) {
                results[i] = res;
                count -= 1;
                if (count === 0) {
                    promise.resolve(results);
                }
            }, function (err) {
                secondPromise.reject(err);
            });
        };

        for (var i = 0; i < promises.length; i++) {
            var prom = promises[i];

            if (prom instanceof ZalgoPromise) {
                if (prom.resolved) {
                    results[i] = prom.value;
                    count -= 1;
                    continue;
                }
            } else if (!_isPromise(prom)) {
                results[i] = prom;
                count -= 1;
                continue;
            }

            chain(i, ZalgoPromise.resolve(prom), promise);
        }

        if (count === 0) {
            promise.resolve(results);
        }

        return promise;
    };

    ZalgoPromise.hash = function hash(promises) {
        // eslint-disable-line no-undef
        var result = {};

        return ZalgoPromise.all(Object.keys(promises).map(function (key) {
            return ZalgoPromise.resolve(promises[key]).then(function (value) {
                result[key] = value;
            });
        })).then(function () {
            return result;
        });
    };

    ZalgoPromise.map = function map(items, method) {
        // $FlowFixMe
        return ZalgoPromise.all(items.map(method));
    };

    ZalgoPromise.onPossiblyUnhandledException = function onPossiblyUnhandledException(handler) {
        return _onPossiblyUnhandledException(handler);
    };

    ZalgoPromise['try'] = function _try(method, context, args) {

        if (method && typeof method !== 'function' && !method.call) {
            throw new Error('Promise.try expected a function');
        }

        var result = void 0;

        startActive();

        try {
            // $FlowFixMe
            result = method.apply(context, args || []);
        } catch (err) {
            endActive();
            return ZalgoPromise.reject(err);
        }

        endActive();

        return ZalgoPromise.resolve(result);
    };

    ZalgoPromise.delay = function delay(_delay) {
        return new ZalgoPromise(function (resolve) {
            setTimeout(resolve, _delay);
        });
    };

    ZalgoPromise.isPromise = function isPromise(value) {

        if (value && value instanceof ZalgoPromise) {
            return true;
        }

        return _isPromise(value);
    };

    ZalgoPromise.flush = function flush() {
        return awaitActive(ZalgoPromise);
    };

    return ZalgoPromise;
}();

export { ZalgoPromise };