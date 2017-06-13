/* @flow */

function trycatch(method, successHandler, errorHandler) {

    let isCalled = false;
    let isSuccess = false;
    let isError = false;
    let err, res;

    function flush() {
        if (isCalled) {
            if (isError) {
                return errorHandler(err);
            } else if (isSuccess) {
                return successHandler(res);
            }
        }
    }

    try {
        method(function(result) {
            res = result;
            isSuccess = true;
            flush();
        }, function(error) {
            err = error;
            isError = true;
            flush();
        });
    } catch (error) {
        return errorHandler(error);
    }

    isCalled = true;
    flush();
}

let possiblyUnhandledPromiseHandlers = [];
let possiblyUnhandledPromises = [];
let possiblyUnhandledPromiseTimeout;

function addPossiblyUnhandledPromise(promise) {
    possiblyUnhandledPromises.push(promise);
    possiblyUnhandledPromiseTimeout = possiblyUnhandledPromiseTimeout || setTimeout(flushPossiblyUnhandledPromises, 1);
}

function flushPossiblyUnhandledPromises() {

    possiblyUnhandledPromiseTimeout = null;
    let promises = possiblyUnhandledPromises;
    possiblyUnhandledPromises = [];

    for (let i = 0; i < promises.length; i++) {
        let promise = promises[i];

        if (promise.silentReject) {
            continue;
        }

        promise.handlers.push({
            onError(err) {
                if (promise.silentReject) {
                    return;
                }

                dispatchError(err);
            }
        });

        promise.dispatch();
    }
}

let dispatchedErrors = [];

function dispatchError(err) {

    if (dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    dispatchedErrors.push(err);

    setTimeout(() => {
        throw err;
    }, 1);

    for (let j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
        possiblyUnhandledPromiseHandlers[j](err);
    }
}


let toString = ({}).toString;

function isPromise(item) {
    try {
        if (!item) {
            return false;
        }

        if (window.Window && item instanceof window.Window) {
            return false;
        }

        if (window.constructor && item instanceof window.constructor) {
            return false;
        }

        if (toString) {
            let name = toString.call(item);

            if (name === '[object Window]' || name === '[object global]' || name === '[object DOMWindow]') {
                return false;
            }
        }

        if (item && item.then instanceof Function) {
            return true;
        }
    } catch (err) {
        return false
    }

    return false
}

export let SyncPromise = function SyncPromise(handler) {

    this.resolved = false;
    this.rejected = false;

    this.silentReject = false;

    this.handlers = [];

    addPossiblyUnhandledPromise(this);

    if (!handler) {
        return;
    }

    let self = this;

    trycatch(handler, function(res) {
        return self.resolve(res);
    }, function(err) {
        return self.reject(err);
    });
};

SyncPromise.resolve = function SyncPromiseResolve(value) {

    if (isPromise(value)) {
        return value;
    }

    return new SyncPromise().resolve(value);
};

SyncPromise.reject = function SyncPromiseResolve(error) {
    return new SyncPromise().reject(error);
};

SyncPromise.prototype.resolve = function (result) {
    if (this.resolved || this.rejected) {
        return this;
    }

    if (isPromise(result)) {
        throw new Error('Can not resolve promise with another promise');
    }

    this.resolved = true;
    this.value = result;
    this.dispatch();

    return this;
};

SyncPromise.prototype.reject = function(error) {
    if (this.resolved || this.rejected) {
        return this;
    }

    if (isPromise(error)) {
        throw new Error('Can not reject promise with another promise');
    }

    // if (!(error instanceof Error)) {
    //     error = new Error(`Expected reject to be called with Error, got ${error}`);
    // }

    if (!error) {
        error = new Error(`Expected reject to be called with Error, got ${error}`);
    }

    this.rejected = true;
    this.value = error;
    this.dispatch();

    return this;
};

SyncPromise.prototype.asyncReject = function(error) {
    this.silentReject = true;
    this.reject(error);
}

SyncPromise.prototype.dispatch = function() {

    if (!this.resolved && !this.rejected) {
        return;
    }

    while (this.handlers.length) {

        let handler = this.handlers.shift();

        let isError = false;
        let result, error;

        try {
            if (this.resolved) {
                result = handler.onSuccess ? handler.onSuccess(this.value) : this.value;
            } else if (this.rejected) {
                if (handler.onError) {
                    result = handler.onError(this.value);
                } else {
                    isError = true;
                    error = this.value;
                }
            }
        } catch (err) {
            isError = true;
            error = err;
        }

        if (result === this) {
            throw new Error('Can not return a promise from the the then handler of the same promise');
        }

        if (!handler.promise) {
            continue;
        }

        if (isError) {
            handler.promise.reject(error);

        } else if (isPromise(result)) {
            result.then(res => { handler.promise.resolve(res); },
                        err => { handler.promise.reject(err);  });

        } else {
            handler.promise.resolve(result);
        }
    }
};

SyncPromise.prototype.then = function(onSuccess, onError) {

    if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
        throw new Error('Promise.then expected a function for success handler');
    }

    if (onError && typeof onError !== 'function' && !onError.call) {
        throw new Error('Promise.then expected a function for error handler');
    }

    let promise = new SyncPromise(null, this);

    this.handlers.push({
        promise: promise,
        onSuccess: onSuccess,
        onError: onError
    });

    this.silentReject = true;

    this.dispatch();

    return promise;
};

SyncPromise.prototype.catch = function(onError) {
    return this.then(null, onError);
};

SyncPromise.prototype.finally = function(handler) {
    return this.then(function(result) {
        return SyncPromise.try(handler)
            .then(() => {
                return result;
            });
    }, function(err) {
        return SyncPromise.try(handler)
            .then(() => {
                throw err;
            });
    });
};

SyncPromise.all = function(promises) {

    let promise = new SyncPromise();
    let count = promises.length;
    let results = [];

    for (let i = 0; i < promises.length; i++) {

        let prom = isPromise(promises[i]) ? promises[i] : SyncPromise.resolve(promises[i]);

        prom.then(function(result) {
            results[i] = result;
            count -= 1;
            if (count === 0) {
                promise.resolve(results);
            }
        }, function(err) {
            promise.reject(err);
        });
    }

    if (!count) {
        promise.resolve(results);
    }

    return promise;
};

SyncPromise.onPossiblyUnhandledException = function syncPromiseOnPossiblyUnhandledException(handler) {
    possiblyUnhandledPromiseHandlers.push(handler);
};

SyncPromise.try = function syncPromiseTry(method) {
    return SyncPromise.resolve().then(method);
}

SyncPromise.delay = function syncPromiseDelay(delay) {
    return new SyncPromise(resolve => {
        setTimeout(resolve, delay);
    });
}

SyncPromise.hash = function(obj) {

    let results = {};
    let promises = [];

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            promises.push(SyncPromise.resolve(obj[key]).then(result => {
                results[key] = result;
            }));
        }
    }

    return SyncPromise.all(promises).then(() => {
        return results;
    });
}

SyncPromise.promisifyCall = function() {

    let args = Array.prototype.slice.call(arguments);
    let method = args.shift();

    if (typeof method !== 'function') {
        throw new Error(`Expected promisifyCall to be called with a function`);
    }

    return new SyncPromise((resolve, reject) => {

        args.push((err, result) => {
            return err ? reject(err) : resolve(result);
        });

        return method.apply(null, args);
    });
}


export function patchPromise() {
    window.Promise = SyncPromise;
}
