/* @flow */

import { SyncPromise } from './promise';
import { isPromise } from './utils';
import { onPossiblyUnhandledException } from './exceptions';

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

SyncPromise.onPossiblyUnhandledException = onPossiblyUnhandledException;

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
