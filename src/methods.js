/* @flow */

import { SyncPromise } from './promise';
import { isPromise } from './utils';
import { onPossiblyUnhandledException } from './exceptions';

SyncPromise.resolve = function SyncPromiseResolve(value) {

    if (isPromise(value)) {
        return value;
    }

    return new SyncPromise().resolve(value);
};

SyncPromise.reject = function SyncPromiseReject(error) {
    return new SyncPromise().reject(error);
};


SyncPromise.all = function SyncPromiseAll(promises) {

    let promise = new SyncPromise();
    let count = promises.length;
    let results = [];

    for (let i = 0; i < promises.length; i++) {

        let prom = isPromise(promises[i]) ? promises[i] : SyncPromise.resolve(promises[i]);

        prom.then((result) => {
            results[i] = result;
            count -= 1;
            if (count === 0) {
                promise.resolve(results);
            }
        }, (err) => {
            promise.reject(err);
        });
    }

    if (!count) {
        promise.resolve(results);
    }

    return promise;
};

SyncPromise.onPossiblyUnhandledException = onPossiblyUnhandledException;

SyncPromise.try = function SyncPromiseTry(method) {
    return SyncPromise.resolve().then(method);
};

SyncPromise.delay = function SyncPromiseDelay(delay) {
    return new SyncPromise(resolve => {
        setTimeout(resolve, delay);
    });
};

SyncPromise.hash = function SyncPromiseHash(obj) {

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
};
