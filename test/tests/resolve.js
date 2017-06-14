/* @flow */

import { SyncPromise } from 'src/index';

describe('resolve cases', () => {

    it('should create a resolved promise and get the value', () => {

        let value = 'foobar';

        return SyncPromise.resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should create a resolved promise with a compound value and get the value', () => {

        let value1 = 'foobar';
        let value2 = 'fizzbuzz';

        return SyncPromise.resolve(value1).then(result1 => {
            return [ result1, value2 ];
        }).then(([ result1, result2 ]) => {

            if (result1 !== value1) {
                throw new Error(`Expected ${result1} to be ${value1}`);
            }

            if (result2 !== value2) {
                throw new Error(`Expected ${result2} to be ${value2}`);
            }
        });
    });

    it('should create a resolved existing promise and get the value', () => {

        let value = 'foobar';

        return (new SyncPromise()).resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should create a resolved promise with the constructor and get the value', () => {

        let value = 'foobar';

        return new SyncPromise(resolve => resolve(value)).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should create a resolved promise asynchronously with the constructor and get the value', () => {

        let value = 'foobar';

        return new SyncPromise(resolve => setTimeout(() => resolve(value), 50)).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should create a resolved promise and get the value', () => {

        let value = 'foobar';

        return SyncPromise.resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should resolve synchronously', () => {

        let hasResolved = false;

        SyncPromise.resolve().then(result => {
            hasResolved = true;
        });

        if (!hasResolved) {
            throw new Error(`Expected sync promise to have resolved`);
        }
    });

    it('should only be able to resolve a promise once', () => {

        let value = 'foobar';
        let promise = SyncPromise.resolve(value);
        promise.resolve('fizzbuzz');
        promise.resolve('$$%^&*');

        return promise.then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should resolve with an existing promise', () => {

        let value = 'foobar';

        return SyncPromise.resolve(SyncPromise.resolve(value)).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should allow returning a promise in then', () => {

        let value = 'foobar';
        let value2 = 'fizzbuzz';

        return SyncPromise.resolve(value).then(result => {
            return SyncPromise.resolve(value2);
        }).then(result => {
            if (result !== value2) {
                throw new Error(`Expected ${result} to be ${value2}`);
            }
        });
    });

    it('should allow returning an asynchronous promise in then', () => {

        let value = 'foobar';
        let value2 = 'fizzbuzz';

        return SyncPromise.resolve(value).then(result => {
            return new SyncPromise(resolve => {
                return setTimeout(() => resolve(value2), 50);
            });
        }).then(result => {
            if (result !== value2) {
                throw new Error(`Expected ${result} to be ${value2}`);
            }
        });
    });

    it('should fail when trying to resolve an existing promise with a promise', () => {

        let value = 'foobar';
        let caughtErr;

        try {
            new SyncPromise(resolve => resolve(SyncPromise.resolve(value))); // eslint-disable-line
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

        return SyncPromise.resolve(value).finally(() => {
            finallyCalled = true;
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
            if (!finallyCalled) {
                throw new Error(`Expected finally to be called`);
            }
        });
    });
});
