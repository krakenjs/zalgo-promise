import { isPromise } from './utils';
import { onPossiblyUnhandledException, dispatchPossiblyUnhandledError } from './exceptions';
import { startActive, endActive, awaitActive } from './flush';

export class ZalgoPromise<R> {

    resolved : boolean;
    rejected : boolean;
    errorHandled : boolean;
    value ?: R;
    error ?: Error;
    handlers : Array<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promise : ZalgoPromise<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onSuccess : ((result ?: R) => ZalgoPromise<unknown> | unknown),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onError : ((error ?: Error) => ZalgoPromise<unknown> | unknown),
    }>;
    dispatching ?: boolean;
    stack ?: string;

    constructor(handler ?: (resolve : (result : R) => void, reject : (error : unknown) => void) => void) {

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
                },
                err => {
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
                this.resolve(result);
            } else if (rejected) {
                this.reject(error);
            }
        }

        // @ts-ignore
        if (__DEBUG__) {
            try {
                throw new Error(`ZalgoPromise`);
            } catch (err) {
                this.stack = (err as Error).stack;
            }
        }
    }

    resolve(result ?: R) : this {
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

    reject(error : unknown) : this {
        if (this.resolved || this.rejected) {
            return this;
        }

        if (isPromise(error)) {
            throw new Error('Can not reject promise with another promise');
        }

        if (!error) {
            const err = error && typeof (error as Error).toString === 'function' ? (error as Error).toString() : Object.prototype.toString.call(error);
            error = new Error(
                `Expected reject to be called with Error, got ${ err }`
            );
        }

        this.rejected = true;
        // @ts-ignore
        this.error = error;

        if (!this.errorHandled) {
            setTimeout(() => {
                if (!this.errorHandled) {
                    dispatchPossiblyUnhandledError(error as Error, this);
                }
            }, 1);
        }

        this.dispatch();
        return this;
    }

    asyncReject(error : unknown) : this {
        this.errorHandled = true;
        this.reject(error);
        return this;
    }

    dispatch() : void {

        const { dispatching, resolved, rejected, handlers } = this;

        if (dispatching) {
            return;
        }

        if (!resolved && !rejected) {
            return;
        }

        this.dispatching = true;
        startActive();

        const chain = <T>(firstPromise : ZalgoPromise<T>, secondPromise : ZalgoPromise<T>) : ZalgoPromise<void> => {
            return firstPromise.then(
                (res) => {
                    secondPromise.resolve(res);
                },
                (err) => {
                    secondPromise.reject(err);
                }
            );
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
                if (result.resolved) {
                    promise.resolve(result.value);
                } else {
                    promise.reject(result.error);
                }

                result.errorHandled = true;
            } else if (isPromise(result)) {
                if (
                    result instanceof ZalgoPromise &&
                    (result.resolved || result.rejected)
                ) {
                    if (result.resolved) {
                        promise.resolve(result.value);
                    } else {
                        promise.reject(result.error);
                    }
                } else {
                    // @ts-ignore
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

    then<X = R, Y = never>(
        onSuccess ?: (result : R) => X | ZalgoPromise<X>,
        onError ?: (error : unknown) => Y | ZalgoPromise<Y>
    ) : ZalgoPromise<X | Y> {

        // @ts-ignore .call
        if (onSuccess && typeof onSuccess !== 'function' && !onSuccess.call) {
            throw new Error('Promise.then expected a function for success handler');
        }

        // @ts-ignore .call
        if (onError && typeof onError !== 'function' && !onError.call) {
            throw new Error('Promise.then expected a function for error handler');
        }

        const promise : ZalgoPromise<X | Y> = new ZalgoPromise<X | Y>();

        // @ts-ignore - update onSuccess and onError
        this.handlers.push({ promise, onSuccess, onError });

        this.errorHandled = true;
        this.dispatch();
        return promise;
    }

    catch<X, Y>(
        onError : (error : unknown) => ZalgoPromise<Y> | Y
    ) : ZalgoPromise<X | Y> {
        return this.then(undefined, onError);
    }

    finally(onFinally : () => unknown) : ZalgoPromise<R> {
        // @ts-ignore
        if (onFinally && typeof onFinally !== 'function' && !onFinally.call) {
            throw new Error('Promise.finally expected a function');
        }

        // @ts-ignore - doesn't match ZalgoPromise<R>
        return this.then(
            (result) => {
                return ZalgoPromise.try(onFinally).then(() => {
                    return result;
                });
            },
            (err) => {
                return ZalgoPromise.try(onFinally).then(() => {
                    throw err;
                });
            }
        );
    }

    timeout(time : number, err : Error | null | undefined) : this {
        if (this.resolved || this.rejected) {
            return this;
        }

        const timeout = setTimeout(() => {
            if (this.resolved || this.rejected) {
                return;
            }

            this.reject(err ?? new Error(`Promise timed out after ${ time }ms`));
        }, time);

        // @ts-ignore subtyping
        return this.then((result) => {
            clearTimeout(timeout);
            return result;
        });
    }

    toPromise() : Promise<R> {
        if (typeof Promise === 'undefined') {
            throw new TypeError(`Could not find Promise`);
        }

        // @ts-ignore
        return Promise.resolve(this);
    }

    lazy() : this {
        this.errorHandled = true;
        return this;
    }

    static resolve<X>(value ?: X | ZalgoPromise<X>) : ZalgoPromise<X> {
        if (value instanceof ZalgoPromise) {
            return value;
        }

        if (isPromise(value)) {
            return new ZalgoPromise((resolve, reject) =>
                // @ts-ignore is it a promise or a value who knows
                value.then(resolve, reject));
        }

        // @ts-ignore is it a promise or a value who knows
        return new ZalgoPromise().resolve(value);
    }

    static reject(error : unknown) : ZalgoPromise<unknown> {
        return new ZalgoPromise().reject(error);
    }

    static asyncReject(error : unknown) : ZalgoPromise<unknown> {
        return new ZalgoPromise().asyncReject(error);
    }

    static all<X extends ReadonlyArray<unknown>>(promises : X) : ZalgoPromise<X> {

        const promise = new ZalgoPromise<X>();
        let count = promises.length;
        // @ts-ignore
        const results = [];

        if (!count) {
            // @ts-ignore
            promise.resolve(results);
            return promise;
        }

        const chain = <T>(i : number, firstPromise : ZalgoPromise<T>, secondPromise : ZalgoPromise<T>) : ZalgoPromise<void> => {
            return firstPromise.then(
                (res) => {
                    results[i] = res;
                    count -= 1;

                    if (count === 0) {
                        // @ts-ignore
                        promise.resolve(results);
                    }
                },
                (err) => {
                    secondPromise.reject(err);
                }
            );
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

            // @ts-ignore
            chain(i, ZalgoPromise.resolve(prom), promise);
        }

        if (count === 0) {
            // @ts-ignore
            promise.resolve(results);
        }

        return promise;
    }

    static hash<T>(promises : Record<string, ZalgoPromise<T> | T>) : ZalgoPromise<Record<string, ZalgoPromise<T> | T>> {
        const result = {};
        const awaitPromises = [];

        for (const key in promises) {
            if (promises.hasOwnProperty(key)) {
                const value = promises[key];

                if (isPromise(value)) {
                    awaitPromises.push(
                        // @ts-ignore
                        value.then((res) => {
                            // @ts-ignore
                            result[key] = res;
                        })
                    );
                } else {
                    // @ts-ignore
                    result[key] = value;
                }
            }
        }

        return ZalgoPromise.all(awaitPromises).then(() => result);
    }

    static map<T, X>(items : ReadonlyArray<T>, method : (arg0 : T) => ZalgoPromise<X> | X) : ZalgoPromise<ReadonlyArray<X>> {
        // @ts-ignore
        return ZalgoPromise.all(items.map(method));
    }

    static onPossiblyUnhandledException(handler : (err : Error | unknown) => void) : { cancel : () => void } {
        return onPossiblyUnhandledException(handler);
    }

    static try<X, Y, C, A extends ReadonlyArray<unknown>>(method : (...args : A) => ZalgoPromise<X> | Y, context ?: C, args ?: A) : ZalgoPromise<X | Y> {
        // @ts-ignore - by the time its not a function call wont exist
        if (method && typeof method !== 'function' && !method.call) {
            throw new Error('Promise.try expected a function');
        }

        let result;
        startActive();

        try {
            // @ts-ignore
            result = method.apply(context, args ?? []);
        } catch (err) {
            endActive();
            // @ts-ignore
            return ZalgoPromise.reject(err);
        }

        endActive();
        // @ts-ignore
        return ZalgoPromise.resolve(result);
    }

    static delay(delay : number) : ZalgoPromise<void> {
        return new ZalgoPromise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    static isPromise(value : unknown) : boolean {
        if (value && value instanceof ZalgoPromise) {
            return true;
        }

        return isPromise(value);
    }

    static flush() : ZalgoPromise<void> {
        // @ts-ignore - so we are passing in the class?
        return awaitActive(ZalgoPromise);
    }
}
