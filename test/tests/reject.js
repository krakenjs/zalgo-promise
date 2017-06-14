/* @flow */

import { ZalgoPromise } from 'src/index';

describe('reject cases', () => {

    it('should create a rejected promise and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.reject(new Error(error)).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise and catch the error in then', () => {

        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.reject(new Error(error)).then(result => {
            throw new Error(`Success handler should not be called`);
        }, err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected existing promise and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return (new ZalgoPromise()).reject(new Error(error)).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise with the constructor and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return new ZalgoPromise((resolve, reject) => reject(new Error(error))).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise asynchronously with the constructor and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return new ZalgoPromise((resolve, reject) => {
            setTimeout(() => reject(new Error(error)), 50);
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise by throwing in the constructor and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return new ZalgoPromise(() => { throw new Error(error); }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise and not call any subsequent thens', () => {

        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.reject(new Error(error)).then(result => {
            throw new Error('This should never be called');
        }).then(result => {
            throw new Error('This should never be called either');
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should create a rejected promise and handle the error then call then', () => {

        let value = 'foobar';
        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.reject(new Error(error)).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
            return value;
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should reject synchronously', () => {

        let hasRejected = false;

        ZalgoPromise.reject(new Error('Some error')).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(() => {
            hasRejected = true;
        });

        if (!hasRejected) {
            throw new Error(`Expected sync promise to have rejected`);
        }
    });

    it('should only be able to reject a promise once', () => {

        let error = 'SERIOUS_ERROR';
        let promise = ZalgoPromise.reject(new Error(error));
        promise.reject(new Error('fizzbuzz'));
        promise.resolve(new Error('$$%^&*'));

        return promise.then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should fail when trying to create a rejected promise with an existing promise', () => {

        let error = 'SERIOUS_ERROR';
        let caughtErr;

        let promise = ZalgoPromise.reject(new Error(error));
        promise.catch(() => {
            // pass
        });

        try {
            ZalgoPromise.reject(promise);
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should allow rejecting the promise by returning a rejected promise in then', () => {

        let value = 'foobar';
        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.resolve(value).then(() => {
            return ZalgoPromise.reject(new Error(error));
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should allow rejecting the promise by returning an async rejected promise in then', () => {

        let value = 'foobar';
        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.resolve(value).then(() => {
            return new ZalgoPromise((resolve, reject) => {
                setTimeout(() => reject(new Error(error)), 50);
            });
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should reject when an error is thrown in a then', () => {

        let value = 'foobar';
        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.resolve(value).then(result => {
            throw new Error(error);
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should reject with the latest error when an error is thrown in a then', () => {

        let value = 'foobar';
        let error = 'SERIOUS_ERROR';
        let error2 = 'TERRIBLE_ERROR';

        return ZalgoPromise.resolve(value).then(result => {
            throw new Error(error);
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(() => {
            throw new Error(error2);
        }).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error2) {
                throw new Error(`Expected ${err.message} to be ${error2}`);
            }
        }).toPromise();
    });

    it('should turn an undefined rejection into an actual error', () => {

        return ZalgoPromise.reject(undefined).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected Error object to be thrown`);
            }
        }).toPromise();
    });

    it('should turn a null rejection into an actual error', () => {

        return ZalgoPromise.reject(null).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected Error object to be thrown`);
            }
        }).toPromise();
    });

    it('should turn a null string rejection into an actual error', () => {

        return ZalgoPromise.reject('').then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected Error object to be thrown`);
            }
        }).toPromise();
    });

    it('should turn an false rejection into an actual error', () => {

        return ZalgoPromise.reject(false).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected Error object to be thrown`);
            }
        }).toPromise();
    });

    it('should keep a string rejection as a string', () => {

        let error = 'SERIOUS_ERROR';

        return ZalgoPromise.reject(error).then(result => {
            throw new Error(`Success handler should not be called`);
        }).catch(err => {
            if (err !== error) {
                throw new Error(`Expected ${Object.prototype.toString.call(err)} to be ${error}`);
            }
        }).toPromise();
    });

    it('should reject when trying to return a promise in its own then method', () => {

        let value = 'foobar';
        let promise = ZalgoPromise.resolve(value);
        let caughtErr;

        try {
            promise.then(() => promise);
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should fail when trying to pass a non-function into then as a success handler', () => {

        let promise = ZalgoPromise.resolve('foobar');
        let caughtErr;

        try {
            // $FlowFixMe
            promise.then(123);
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should fail when trying to pass a non-function into then as an error handler', () => {

        let promise = ZalgoPromise.resolve('foobar');
        let caughtErr;

        try {
            // $FlowFixMe
            promise.then(null, 123);
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should fail when trying to pass a non-function into catch as an error handler', () => {

        let promise = ZalgoPromise.resolve('foobar');
        let caughtErr;

        try {
            // $FlowFixMe
            promise.catch(123);
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should call unhandled promise method when promise is rejected without having a handler', (done) => {

        window.onerror = () => {
            // pass
        };

        let listener = ZalgoPromise.onPossiblyUnhandledException(err => {
            listener.cancel();
            if (!(err instanceof Error)) {
                return done(new Error(`Expected error to be thrown`));
            }
            return done();
        });

        ZalgoPromise.reject(new Error('foobar'));
    });

    it('should not call unhandled promise method when promise is async-rejected without having a handler', (done) => {

        window.onerror = () => {
            // pass
        };

        let onPossiblyUnhandledExceptionCalled = false;

        let listener = ZalgoPromise.onPossiblyUnhandledException(() => {
            onPossiblyUnhandledExceptionCalled = true;
        });

        (new ZalgoPromise()).asyncReject(new Error('foobar'));

        setTimeout(() => {
            listener.cancel();
            if (onPossiblyUnhandledExceptionCalled) {
                return done(new Error(`Expected onPossiblyUnhandledException handler to not be called`));
            }
            return done();
        }, 100);
    });

    it('should create a rejected promise and call finally even if the error is not caught', () => {

        window.onerror = () => {
            // pass
        };

        let error = 'SERIOUS_ERROR';
        let finallyCalled = false;

        return ZalgoPromise.reject(new Error(error)).then(result => {
            throw new Error(`Success handler should not be called`);
        }).finally(() => {
            finallyCalled = true;
        }).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
            if (!finallyCalled) {
                throw new Error(`Expected finally to be called`);
            }
        }).toPromise();
    });

    it('should call unhandled promise method only once for a given error', (done) => {

        window.onerror = () => {
            // pass
        };

        let error = new Error('foobar');
        let handlerCalled = 0;

        let listener = ZalgoPromise.onPossiblyUnhandledException(() => {
            handlerCalled += 1;
        });

        ZalgoPromise.reject(error);
        ZalgoPromise.reject(error);
        ZalgoPromise.reject(error);

        setTimeout(() => {
            listener.cancel();
            if (handlerCalled !== 1) {
                return done(new Error(`Expected handler to be called 1 time, got ${handlerCalled}`));
            }
            return done();
        }, 50);
    });

    it('should not call unhandled promise method when promise is rejected after a handler is subsequently added', (done) => {

        window.onerror = () => {
            // pass
        };

        let onPossiblyUnhandledExceptionCalled = false;

        let listener = ZalgoPromise.onPossiblyUnhandledException(() => {
            onPossiblyUnhandledExceptionCalled = true;
        });

        let promise = new ZalgoPromise();

        setTimeout(() => {

            promise.catch(() => {
                // pass
            });
            promise.reject(new Error('foobar'));

            setTimeout(() => {
                listener.cancel();
                if (onPossiblyUnhandledExceptionCalled) {
                    return done(new Error(`Expected onPossiblyUnhandledException handler to not be called`));
                }
                return done();
            }, 100);
        }, 100);
    });
});
