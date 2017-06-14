/* @flow */

import { isPromise, trycatch } from './utils';
import { addPossiblyUnhandledPromise } from './exceptions';

export class SyncPromise {

    constructor(handler) {
        this.resolved = false;
        this.rejected = false;

        this.silentReject = false;

        this.handlers = [];

        addPossiblyUnhandledPromise(this);

        if (!handler) {
            return;
        }

        trycatch(handler, res => this.resolve(res), err => this.reject(err));
    }

    resolve(result) {
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
    }

    reject(error) {
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
    }

    asyncReject(error) {
        this.silentReject = true;
        this.reject(error);
    }

    dispatch() {

        if (!this.resolved && !this.rejected) {
            return;
        }

        while (this.handlers.length) {

            let handler = this.handlers.shift();

            let isError = false;
            let result,
                error;

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
    }

    then(onSuccess, onError) {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        let promise = new SyncPromise(null, this);

        this.handlers.push({
            promise,
            onSuccess,
            onError
        });

        this.silentReject = true;

        this.dispatch();

        return promise;
    }

    catch(onError) {
        return this.then(null, onError);
    }

    finally(handler) {
        return this.then((result) => {
            return SyncPromise.try(handler)
                .then(() => {
                    return result;
                });
        }, (err) => {
            return SyncPromise.try(handler)
                .then(() => {
                    throw err;
                });
        });
    }
}
