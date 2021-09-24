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
    // eslint-disable-next-line flowtype/no-mutable-array
    handlers : Array<{|
        promise : ZalgoPromise<*>,
        onSuccess : void | (result : R) => mixed,
        onError : void | (error : mixed) => mixed
    |}>
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
            const err = (error && typeof error.toString === 'function' ? error.toString() : Object.prototype.toString.call(error));
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

        const { dispatching, resolved, rejected, handlers } = this;

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

            const { onSuccess, onError, promise } = handlers[i];

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
                const promiseResult : ZalgoPromise<*> = result;

                if (promiseResult.resolved) {
                    promise.resolve(promiseResult.value);
                } else {
                    promise.reject(promiseResult.error);
                }

                promiseResult.errorHandled = true;

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

    then<X, Y>(onSuccess : void | (result : R) => (ZalgoPromise<X> | Y), onError : void | (error : mixed) => (ZalgoPromise<X> | Y)) : ZalgoPromise<X | Y> {

        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        const promise = new ZalgoPromise();

        this.handlers.push({
            promise,
            onSuccess,
            onError
        });

        this.errorHandled = true;

        this.dispatch();

        return promise;
    }

    catch<X, Y>(onError : (error : mixed) => ZalgoPromise<X> | Y) : ZalgoPromise<X | Y> {
        // $FlowFixMe incompatible-call
        const resultPromise : ZalgoPromise<X | Y> = this.then(undefined, onError);
        return resultPromise;
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

        const timeout = setTimeout(() => {

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

    lazy() : ZalgoPromise<R> {
        this.errorHandled = true;
        return this;
    }

    static resolve<X, Y>(value : ZalgoPromise<X> | Y) : ZalgoPromise<X | Y> {

        if (value instanceof ZalgoPromise) {
            // $FlowFixMe incompatible-type-arg
            const result : ZalgoPromise<X | Y> = value;
            return result;
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

    static all<X : $ReadOnlyArray<mixed>>(promises : X) : ZalgoPromise<$TupleMap<X, <Y>(ZalgoPromise<Y> | Y) => Y>> { // eslint-disable-line no-undef

        const promise = new ZalgoPromise();
        let count = promises.length;
        // eslint-disable-next-line no-undef
        const results = ([] : $TupleMap<X, <Y>(ZalgoPromise<Y> | Y) => Y>).slice();

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
            const prom = promises[i];

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
        const result = {};
        const awaitPromises = [];

        for (const key in promises) {
            if (promises.hasOwnProperty(key)) {
                const value = promises[key];

                if (isPromise(value)) {
                    awaitPromises.push(value.then(res => {
                        result[key] = res;
                    }));
                } else {
                    result[key] = value;
                }
            }
        }
        
        return ZalgoPromise.all(awaitPromises).then(() => result);
    }

    static map<T, X>(items : $ReadOnlyArray<T>, method : (T) => (ZalgoPromise<X> | X)) : ZalgoPromise<$ReadOnlyArray<X>> {
        // $FlowFixMe
        return ZalgoPromise.all(items.map(method));
    }

    static onPossiblyUnhandledException(handler : (err : mixed) => void) : {| cancel : () => void |} {
        return onPossiblyUnhandledException(handler);
    }

    static try<X, Y, C : mixed, A : $ReadOnlyArray<mixed>>(method : (...args : $ReadOnlyArray<mixed>) => (ZalgoPromise<X> | Y), context? : C, args? : A) : ZalgoPromise<X | Y> {

        if (method && typeof method !== 'function' && !method.call) {
            throw new Error('Promise.try expected a function');
        }

        let result : ZalgoPromise<X> | Y;

        startActive();
        
        try {
            result = method.apply(context, args || []);
        } catch (err) {
            endActive();
            return ZalgoPromise.reject(err);
        }

        endActive();

        // $FlowFixMe incompatible-call
        const resultPromise = ZalgoPromise.resolve(result);

        return resultPromise;
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
