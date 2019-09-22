/* @flow */

import { isPromise } from './utils';
import { onPossiblyUnhandledException, dispatchPossiblyUnhandledError } from './exceptions';
import { startActive, endActive, awaitActive } from './flush';

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
    stack : string

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

            startActive();

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
                endActive();
                this.reject(err);
                return;
            }

            endActive();

            isAsync = true;

            if (resolved) {
                // $FlowFixMe
                this.resolve(result);
            } else if (rejected) {
                this.reject(error);
            }
        }

        if (__DEBUG__) {
            try {
                throw new Error(`ZalgoPromise`);
            } catch (err) {
                this.stack = err.stack;
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
            // $FlowFixMe
            let err = (error && typeof error.toString === 'function' ? error.toString() : Object.prototype.toString.call(error));
            error = new Error(`Expected reject to be called with Error, got ${ err }`);
        }

        this.rejected = true;
        this.error = error;

        if (!this.errorHandled) {
            setTimeout(() => {
                if (!this.errorHandled) {
                    dispatchPossiblyUnhandledError(error, this);
                }
            }, 1);
        }

        this.dispatch();

        return this;
    }

    asyncReject(error : mixed) : ZalgoPromise<R> {
        this.errorHandled = true;
        this.reject(error);
        return this;
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
        startActive();

        const chain = <T>(firstPromise : ZalgoPromise<T>, secondPromise : ZalgoPromise<T>) => {
            return firstPromise.then(res => {
                secondPromise.resolve(res);
            }, err => {
                secondPromise.reject(err);
            });
        };

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
                    chain(result, promise);
                }

            } else {

                promise.resolve(result);
            }
        }

        handlers.length = 0;
        this.dispatching = false;
        endActive();
    }

    then<X : mixed, Y : mixed>(onSuccess : void | (result : R) => (ZalgoPromise<X> | Y), onError : void | (error : mixed) => (ZalgoPromise<X> | Y)) : ZalgoPromise<X | Y> {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        let promise : ZalgoPromise<X | Y> = new ZalgoPromise();

        this.handlers.push({
            promise,
            onSuccess,
            onError
        });

        this.errorHandled = true;

        this.dispatch();

        return promise;
    }

    catch<X : mixed, Y : mixed>(onError : (error : mixed) => ZalgoPromise<X> | Y) : ZalgoPromise<X | Y> {
        return this.then(undefined, onError);
    }

    finally(onFinally : () => mixed) : ZalgoPromise<R> {

        if (onFinally && typeof onFinally !== 'function' && !onFinally.call) {
            throw new Error('Promise.finally expected a function');
        }

        return this.then((result) => {
            return ZalgoPromise.try(onFinally)
                .then(() => {
                    return result;
                });
        }, (err) => {
            return ZalgoPromise.try(onFinally)
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

            this.reject(err || new Error(`Promise timed out after ${ time }ms`));

        }, time);

        return this.then(result => {
            clearTimeout(timeout);
            return result;
        });
    }

    // $FlowFixMe
    toPromise() : Promise<R> {
        // $FlowFixMe
        if (typeof Promise === 'undefined') {
            throw new TypeError(`Could not find Promise`);
        }
        // $FlowFixMe
        return Promise.resolve(this); // eslint-disable-line compat/compat
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

    static asyncReject(error : mixed) : ZalgoPromise<R> {
        return new ZalgoPromise().asyncReject(error);
    }

    static all<X : Array<mixed>>(promises : X) : ZalgoPromise<$TupleMap<X, <Y>(ZalgoPromise<Y> | Y) => Y>> { // eslint-disable-line no-undef

        let promise = new ZalgoPromise();
        let count = promises.length;
        let results = [];

        if (!count) {
            promise.resolve(results);
            return promise;
        }

        const chain = <T>(i : number, firstPromise : ZalgoPromise<T>, secondPromise : ZalgoPromise<T>) => {
            return firstPromise.then(res => {
                results[i] = res;
                count -= 1;
                if (count === 0) {
                    promise.resolve(results);
                }
            }, err => {
                secondPromise.reject(err);
            });
        };

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

            chain(i, ZalgoPromise.resolve(prom), promise);
        }

        if (count === 0) {
            promise.resolve(results);
        }

        return promise;
    }

    static hash<O : Object>(promises : O) : ZalgoPromise<$ObjMap<O, <Y>(ZalgoPromise<Y> | Y) => Y>> { // eslint-disable-line no-undef
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

    static onPossiblyUnhandledException(handler : (err : mixed) => void) : { cancel : () => void } {
        return onPossiblyUnhandledException(handler);
    }

    static try<X : mixed, Y : mixed, C : mixed, A : Array<mixed>>(method : (...args : A) => (ZalgoPromise<X> | Y), context : ?C, args : ?A) : ZalgoPromise<X | Y> {

        if (method && typeof method !== 'function' && !method.call) {
            throw new Error('Promise.try expected a function');
        }

        let result;

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
        return awaitActive(ZalgoPromise);
    }
}
