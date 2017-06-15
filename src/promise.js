/* @flow */

import { isPromise } from './utils';
import { onPossiblyUnhandledException, addPossiblyUnhandledPromise } from './exceptions';

export class ZalgoPromise<R : mixed> {

    resolved : boolean
    rejected : boolean
    silentReject : boolean
    value : R
    error : mixed
    handlers : Array<{
        promise : ZalgoPromise<*>,
        onSuccess : void | (result : R) => mixed,
        onError : void | (error : mixed) => mixed
    }>

    constructor(handler : ?(resolve : (result : R) => void, reject : (error : mixed) => void) => void) {

        this.resolved = false;
        this.rejected = false;
        this.silentReject = false;

        this.handlers = [];

        addPossiblyUnhandledPromise(this);

        if (handler) {

            let result;
            let error;
            let resolved = false;
            let rejected = false;
            let isAsync = false;

            try {
                handler(res => {
                    if (isAsync) {
                        this.resolve(res);
                    } else {
                        resolved = true;
                        result = res;
                    }

                }, err => {
                    if (isAsync) {
                        this.reject(err);
                    } else {
                        rejected = true;
                        error = err;
                    }
                });

            } catch (err) {
                this.reject(err);
                return;
            }

            isAsync = true;

            if (resolved) {
                // $FlowFixMe
                this.resolve(result);
            } else if (rejected) {
                this.reject(error);
            }
        }
    }

    resolve(result : R) : ZalgoPromise<R> {
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

    reject(error : mixed) : ZalgoPromise<R> {
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

    then<X : mixed>(onSuccess : void | (result : R) => X | ZalgoPromise<X>, onError : void | (error : mixed) => mixed) : ZalgoPromise<X> {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        let promise : ZalgoPromise<X> = new ZalgoPromise();

        this.handlers.push({
            promise,
            onSuccess,
            onError
        });

        this.silentReject = true;

        this.dispatch();

        return promise;
    }

    catch(onError : (error : mixed) => mixed) : ZalgoPromise<R> {
        return this.then(undefined, onError);
    }

    finally(handler : () => mixed) {
        return this.then((result) => {
            return ZalgoPromise.try(handler)
                .then(() => {
                    return result;
                });
        }, (err) => {
            return ZalgoPromise.try(handler)
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

    static resolve<X : mixed>(value : X | ZalgoPromise<X>) : ZalgoPromise<X> {

        if (isPromise(value) || value instanceof ZalgoPromise) {
            // $FlowFixMe
            return value;
        }

        return new ZalgoPromise().resolve(value);
    }

    static reject(error : mixed) : ZalgoPromise<R> {
        return new ZalgoPromise().reject(error);
    }

    static all<Y : mixed>(promises : Array<Y | ZalgoPromise<Y>>) : ZalgoPromise<Array<Y>> {

        let promise : ZalgoPromise<Array<Y>> = new ZalgoPromise();
        let count = promises.length;
        let results : Array<Y> = [];

        for (let i = 0; i < promises.length; i++) {

            let val = promises[i];

            ZalgoPromise.resolve(val).then(result => {
                // $FlowFixMe
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
        return ZalgoPromise.resolve().then(method);
    }

    static delay(delay : number) : ZalgoPromise<void> {
        return new ZalgoPromise(resolve => {
            setTimeout(resolve, delay);
        });
    }

    static hash<X : mixed>(obj : { [string] : X | ZalgoPromise<X> }) : ZalgoPromise<{ [string] : X }> {

        let results = {};
        let promises = [];

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                promises.push(ZalgoPromise.resolve(obj[key]).then(result => {
                    results[key] = result;
                }));
            }
        }

        return ZalgoPromise.all(promises).then(() => {
            return results;
        });
    }
}

let prom : ZalgoPromise<mixed> = new ZalgoPromise();

prom.resolve(undefined);
