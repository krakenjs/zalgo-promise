/* @flow */

import { isPromise, trycatch } from './utils';
import { onPossiblyUnhandledException, addPossiblyUnhandledPromise } from './exceptions';

export class SyncPromise<R : mixed> {

    resolved : boolean
    rejected : boolean
    silentReject : boolean
    value : R
    error : mixed
    handlers : Array<{
        promise : SyncPromise<*>,
        onSuccess : ?(result : R) => mixed,
        onError : ?(error : mixed) => mixed
    }>

    constructor(handler : ?(resolve : (result : R) => void, reject : (error : mixed) => void) => void) {

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

    resolve(result : R) : SyncPromise<R> {
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

    reject(error : mixed) : SyncPromise<R> {
        if (this.resolved || this.rejected) {
            return this;
        }

        if (isPromise(error)) {
            throw new Error('Can not reject promise with another promise');
        }

        if (!error) {
            let err = (error && typeof error.toString === 'function' ? error.toString() : Object.prototype.toString.call(error));
            error = new Error(`Expected reject to be called with Error, got ${err}`);
        }

        this.rejected = true;
        this.error = error;
        this.dispatch();

        return this;
    }

    asyncReject(error : mixed) {
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
                        result = handler.onError(this.error);
                    } else {
                        isError = true;
                        error = this.error;
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

            } else if (isPromise(result) && typeof result === 'object' && result !== null && typeof result.then === 'function') {
                result.then(res => { handler.promise.resolve(res); },
                            err => { handler.promise.reject(err);  });

            } else {
                handler.promise.resolve(result);
            }
        }
    }

    then<X : mixed>(onSuccess : ?(result : R) => X | SyncPromise<X>, onError : ?(error : mixed) => mixed) : SyncPromise<X> {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        let promise : SyncPromise<X> = new SyncPromise();

        this.handlers.push({
            promise,
            onSuccess,
            onError
        });

        this.silentReject = true;

        this.dispatch();

        return promise;
    }

    catch(onError : (error : mixed) => mixed) : SyncPromise<R> {
        return this.then(undefined, onError);
    }

    finally(handler : () => mixed) {
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

    toPromise() : Promise<R> {
        if (!window.Promise) {
            throw new Error(`Could not find window.Promise`);
        }
        return window.Promise.resolve(this);
    }

    static resolve<X : mixed>(value : X | SyncPromise<X>) : SyncPromise<X> {

        if (isPromise(value) || value instanceof SyncPromise) {
            // $FlowFixMe
            return value;
        }

        return new SyncPromise().resolve(value);
    }

    static reject(error : mixed) : SyncPromise<R> {
        return new SyncPromise().reject(error);
    }

    static all<Y>(promises : Array<Y | SyncPromise<Y>>) : SyncPromise<Array<Y>> {

        let promise : SyncPromise<Array<Y>> = new SyncPromise();
        let count = promises.length;
        let results : Array<Y> = [];

        for (let i = 0; i < promises.length; i++) {

            let val = promises[i];

            // $FlowFixMe
            let prom = SyncPromise.resolve(val);

            prom.then(result => {
                results[i] = result;
                count -= 1;
                if (count === 0) {
                    promise.resolve(results);
                }
            }, err => {
                promise.reject(err);
            });
        }

        if (!count) {
            promise.resolve(results);
        }

        return promise;
    }

    static onPossiblyUnhandledException(handler : (err : mixed) => mixed) : { cancel : () => void } {
        return onPossiblyUnhandledException(handler);
    }

    static try(method : () => mixed) {
        return SyncPromise.resolve().then(method);
    }

    static delay(delay : number) : SyncPromise<void> {
        return new SyncPromise(resolve => {
            setTimeout(resolve, delay);
        });
    }

    static hash<X : mixed>(obj : { [string] : X | SyncPromise<X> }) : SyncPromise<{ [string] : X }> {

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
}
