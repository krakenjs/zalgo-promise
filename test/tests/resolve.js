/* @flow */

import { ZalgoPromise } from 'src/promise';

describe('resolve cases', () => {

    it('should create a resolved promise and get the value', () => {

        let value = 'foobar';

        return ZalgoPromise.resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should create a resolved promise with a compound value and get the value', () => {

        let value1 = 'foobar';
        let value2 = 'fizzbuzz';

        return ZalgoPromise.resolve(value1).then(result1 => {
            return [ result1, value2 ];
        }).then(([ result1, result2 ]) => {

            if (result1 !== value1) {
                throw new Error(`Expected ${result1} to be ${value1}`);
            }

            if (result2 !== value2) {
                throw new Error(`Expected ${result2} to be ${value2}`);
            }
        }).toPromise();
    });

    it('should create a resolved existing promise and get the value', () => {

        let value = 'foobar';

        return (new ZalgoPromise()).resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should create a resolved promise with the constructor and get the value', () => {

        let value = 'foobar';

        return new ZalgoPromise(resolve => resolve(value)).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should create a resolved promise asynchronously with the constructor and get the value', () => {

        let value = 'foobar';

        return new ZalgoPromise(resolve => {
            setTimeout(() => resolve(value), 50);
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should create a resolved promise and get the value', () => {

        let value = 'foobar';

        return ZalgoPromise.resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should resolve synchronously', () => {

        let hasResolved = false;

        ZalgoPromise.resolve().then(result => {
            hasResolved = true;
        });

        if (!hasResolved) {
            throw new Error(`Expected sync promise to have resolved`);
        }
    });

    it('should only be able to resolve a promise once', () => {

        let value = 'foobar';
        let promise = ZalgoPromise.resolve(value);
        promise.resolve('fizzbuzz');
        promise.resolve('$$%^&*');

        return promise.then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should resolve with an existing promise', () => {

        let value = 'foobar';

        return ZalgoPromise.resolve(ZalgoPromise.resolve(value)).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        }).toPromise();
    });

    it('should allow returning a promise in then', () => {

        let value = 'foobar';
        let value2 = 'fizzbuzz';

        return ZalgoPromise.resolve(value).then(result => {
            return ZalgoPromise.resolve(value2);
        }).then(result => {
            if (result !== value2) {
                throw new Error(`Expected ${result} to be ${value2}`);
            }
        }).toPromise();
    });

    it('should allow returning an asynchronous promise in then', () => {

        let value = 'foobar';
        let value2 = 'fizzbuzz';

        return ZalgoPromise.resolve(value).then(result => {
            return new ZalgoPromise(resolve => {
                setTimeout(() => resolve(value2), 50);
            });
        }).then(result => {
            if (result !== value2) {
                throw new Error(`Expected ${result} to be ${value2}`);
            }
        }).toPromise();
    });

    it('should fail when trying to resolve an existing promise with a promise', () => {

        let value = 'foobar';
        let caughtErr;

        try {
            new ZalgoPromise(resolve => resolve(ZalgoPromise.resolve(value))); // eslint-disable-line
        } catch (err) {
            caughtErr = err;
        }

        if (!(caughtErr instanceof Error)) {
            throw new Error(`Expected error to be thrown`);
        }
    });

    it('should create a resolved promise and call finally', () => {

        let value = 'foobar';
        let finallyCalled = false;

        return ZalgoPromise.resolve(value).finally(() => {
            finallyCalled = true;
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
            if (!finallyCalled) {
                throw new Error(`Expected finally to be called`);
            }
        }).toPromise();
    });

    it('should be able to attach a then handler in the then handler for a promise', () => {

        let promise = ZalgoPromise.resolve();

        return promise.then(() => {
            return promise.then(() => {
                // pass
            });
        }).toPromise();
    });

    it('should create a resolved promise and register multiple then handlers', () => {

        let value = 'foobar';
        let promise = ZalgoPromise.resolve(value);

        let thenCount = 0;

        return ZalgoPromise.all([
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            }),
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            })
        ]).then(() => {

            if (thenCount !== 2) {
                throw new Error(`Expected then to have been called 2 times, got ${thenCount} calls`);
            }
        }).toPromise();
    });

    it('should create a resolved promise and register multiple then handlers, resolved asynchronously', () => {

        let value = 'foobar';
        let promise = new ZalgoPromise(resolve => {
            setTimeout(() => resolve(value), 1);
        });

        let thenCount = 0;

        return ZalgoPromise.all([
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            }),
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            })
        ]).then(() => {

            if (thenCount !== 2) {
                throw new Error(`Expected then to have been called 2 times, got ${thenCount} calls`);
            }
        }).toPromise();
    });

    it('should create a resolved promise and register multiple then handlers with one failure', () => {

        let value = 'foobar';
        let promise = ZalgoPromise.resolve(value);

        let thenCount = 0;
        let errorHandlerCalled = false;

        return ZalgoPromise.all([
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            }),
            promise.then(result => {
                thenCount += 1;
                throw new Error('oh no!');
            }),
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            })
        ]).catch(() => {

            errorHandlerCalled = true;

            if (thenCount !== 3) {
                throw new Error(`Expected then to have been called 3 times, got ${thenCount} calls`);
            }

        }).then(() => {

            if (!errorHandlerCalled) {
                throw new Error(`Expected error handler to be called`);
            }

        }).toPromise();
    });

    it('should create a resolved promise and register multiple then handlers with one failure, resolved asynchronously', () => {

        let value = 'foobar';
        let promise = new ZalgoPromise(resolve => {
            setTimeout(() => resolve(value), 1);
        });

        let thenCount = 0;
        let errorHandlerCalled = false;

        return ZalgoPromise.all([
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            }),
            promise.then(result => {
                thenCount += 1;
                throw new Error('oh no!');
            }),
            promise.then(result => {
                thenCount += 1;
                if (result !== value) {
                    throw new Error(`Expected ${result} to be ${value}`);
                }
            })
        ]).catch(() => {

            errorHandlerCalled = true;

            if (thenCount !== 2) {
                throw new Error(`Expected then to have been called 2 times, got ${thenCount} calls`);
            }

        }).then(() => {

            if (!errorHandlerCalled) {
                throw new Error(`Expected error handler to be called`);
            }

        }).toPromise();
    });

    it('should work when trying to return a promise in its own then method', () => {

        let value = 'foobar';
        let promise = ZalgoPromise.resolve(value);

        return promise.then(() => promise).then(result => {

            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }

        }).toPromise();
    });
});
