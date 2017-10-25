/* @flow */

import { isPromise } from './utils';
import { onPossiblyUnhandledException, dispatchPossiblyUnhandledError } from './exceptions';

let global = window.__zalgopromise__ = window.__zalgopromise__ || {
    flushPromises: [],
    activeCount: 0
};

export class ZalgoPromise<R : mixed> {

    resolved : boolean
    rejected : boolean
    errorHandled : boolean
    value : R
    error : mixed
    handlers : Array<{
        promise : ZalgoPromise<*>,
        onSuccess : void | (result : R) => mixed,
        onError : void | (error : mixed) => mixed
    }>
    dispatching : boolean

    constructor(handler : ?(resolve : (result : R) => void, reject : (error : mixed) => void) => void) {

        this.resolved = false;
        this.rejected = false;
        this.errorHandled = false;

        this.handlers = [];

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

        if (!this.errorHandled) {
            setTimeout(() => {
                if (!this.errorHandled) {
                    dispatchPossiblyUnhandledError(error);
                }
            }, 1);
        }

        this.dispatch();

        return this;
    }

    asyncReject(error : mixed) {
        this.errorHandled = true;
        this.reject(error);
    }

    dispatch() {

        let { dispatching, resolved, rejected, handlers } = this;

        if (dispatching) {
            return;
        }

        if (!resolved && !rejected) {
            return;
        }

        this.dispatching = true;
        global.activeCount += 1;

        for (let i = 0; i < handlers.length; i++) {

            let { onSuccess, onError, promise } = handlers[i];

            let result;

            if (resolved) {

                try {
                    result = onSuccess ? onSuccess(this.value) : this.value;
                } catch (err) {
                    promise.reject(err);
                    continue;
                }

            } else if (rejected) {

                if (!onError) {
                    promise.reject(this.error);
                    continue;
                }

                try {
                    result = onError(this.error);
                } catch (err) {
                    promise.reject(err);
                    continue;
                }
            }

            if (result instanceof ZalgoPromise && (result.resolved || result.rejected)) {

                if (result.resolved) {
                    promise.resolve(result.value);
                } else {
                    promise.reject(result.error);
                }

                result.errorHandled = true;

            } else if (isPromise(result)) {

                if (result instanceof ZalgoPromise && (result.resolved || result.rejected)) {
                    if (result.resolved) {
                        promise.resolve(result.value);
                    } else {
                        promise.reject(result.error);
                    }

                } else {
                    // $FlowFixMe
                    result.then(res => { promise.resolve(res); },
                                err => { promise.reject(err);  });
                }

            } else {

                promise.resolve(result);
            }
        }

        handlers.length = 0;
        this.dispatching = false;
        global.activeCount -= 1;

        if (global.activeCount === 0) {
            ZalgoPromise.flushQueue();
        }
    }

    then<X : mixed>(onSuccess : void | (result : R) => (ZalgoPromise<X> | X), onError : void | (error : mixed) => (ZalgoPromise<X> | X)) : ZalgoPromise<X> {

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

        this.errorHandled = true;

        this.dispatch();

        return promise;
    }

    catch<X : mixed>(onError : (error : mixed) => X | ZalgoPromise<X>) : ZalgoPromise<X> {
        return this.then(undefined, onError);
    }

    finally(handler : () => mixed) : ZalgoPromise<R> {
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

    timeout(time : number, err : ?Error) : ZalgoPromise<R> {

        if (this.resolved || this.rejected) {
            return this;
        }

        let timeout = setTimeout(() => {

            if (this.resolved || this.rejected) {
                return;
            }

            this.reject(err || new Error(`Promise timed out after ${time}ms`));

        }, time);

        return this.then(result => {
            clearTimeout(timeout);
            return result;
        });
    }

    toPromise() : Promise<R> {
        if (!window.Promise) {
            throw new Error(`Could not find window.Promise`);
        }
        return window.Promise.resolve(this);
    }

    static resolve<X : mixed>(value : X | ZalgoPromise<X>) : ZalgoPromise<X> {

        if (value instanceof ZalgoPromise) {
            return value;
        }

        if (isPromise(value)) {
            // $FlowFixMe
            return new ZalgoPromise((resolve, reject) => value.then(resolve, reject));
        }

        return new ZalgoPromise().resolve(value);
    }

    static reject(error : mixed) : ZalgoPromise<R> {
        return new ZalgoPromise().reject(error);
    }

    static all<X: Array<mixed>>(promises : X) : ZalgoPromise<$TupleMap<X, <Y>(ZalgoPromise<Y> | Y) => Y>> {

        let promise = new ZalgoPromise();
        let count = promises.length;
        let results = [];

        if (!count) {
            promise.resolve(results);
            return promise;
        }

        for (let i = 0; i < promises.length; i++) {
            let prom = promises[i];

            if (prom instanceof ZalgoPromise) {
                if (prom.resolved) {
                    results[i] = prom.value;
                    count -= 1;
                    continue;
                }
            } else if (!isPromise(prom)) {
                results[i] = prom;
                count -= 1;
                continue;
            }

            ZalgoPromise.resolve(prom).then(result => {
                results[i] = result;
                count -= 1;
                if (count === 0) {
                    promise.resolve(results);
                }
            }, err => {
                promise.reject(err);
            });
        }

        if (count === 0) {
            promise.resolve(results);
        }

        return promise;
    }

    static hash<A, O : { [string] : (A | ZalgoPromise<A>) }>(promises : O) : ZalgoPromise<$ObjMap<O, <Y>(ZalgoPromise<Y> | Y) => Y>> {
        let result = {};
        
        return ZalgoPromise.all(Object.keys(promises).map(key => {
            return ZalgoPromise.resolve(promises[key]).then(value => {
                result[key] = value;
            });
        })).then(() => {
            return result;
        });
    }

    static map<T, X>(items : Array<T>, method : (T) => (ZalgoPromise<X> | X)) : ZalgoPromise<Array<X>> {
        // $FlowFixMe
        return ZalgoPromise.all(items.map(method));
    }

    static onPossiblyUnhandledException(handler : (err : mixed) => mixed) : { cancel : () => void } {
        return onPossiblyUnhandledException(handler);
    }

    static try<X : mixed, C : mixed, A : Array<mixed>>(method : (...args : A) => (ZalgoPromise<X> | X), context : ?C, args : ?A) : ZalgoPromise<X> {

        let result;
        
        try {
            // $FlowFixMe
            result = method.apply(context, args || []);
        } catch (err) {
            return ZalgoPromise.reject(err);
        }

        return ZalgoPromise.resolve(result);
    }

    static delay(delay : number) : ZalgoPromise<void> {
        return new ZalgoPromise(resolve => {
            setTimeout(resolve, delay);
        });
    }

    static isPromise(value : mixed) : boolean {

        if (value && value instanceof ZalgoPromise) {
            return true;
        }

        return isPromise(value);
    }

    static flush() : ZalgoPromise<void> {
        let promise = new ZalgoPromise();
        global.flushPromises.push(promise);

        if (global.activeCount === 0) {
            ZalgoPromise.flushQueue();
        }

        return promise;
    }

    static flushQueue() {
        let promisesToFlush = global.flushPromises;
        global.flushPromises = [];

        for (let promise of promisesToFlush) {
            promise.resolve();
        }
    }
}
