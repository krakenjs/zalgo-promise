/* @flow */

import { SyncPromise } from 'src/index';

describe('promise method cases', () => {

    it('should work with a set of resolved promises in promise.all', () => {

        return Promise.resolve(SyncPromise.all([
            SyncPromise.resolve(1),
            SyncPromise.resolve(2),
            SyncPromise.resolve(3)
        ]).then(([ one, two, three ]) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${one}`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${two}`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${three}`);
            }
        }));
    });

    it('should work with a set of resolved values or promises in promise.all', () => {

        return SyncPromise.all([
            1,
            SyncPromise.resolve(2),
            3
        ]).then(([ one, two, three ]) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${one}`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${two}`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${three}`);
            }
        }).toPromise();
    });

    it('should reject with any rejected promise from promise.all', () => {

        let error = 'SERIOUS_ERROR';

        return SyncPromise.all([
            SyncPromise.resolve(1),
            SyncPromise.reject(new Error(error)),
            SyncPromise.resolve(3)
        ]).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should reject with the first rejected promise from promise.all', () => {

        let error = 'SERIOUS_ERROR';
        let error2 = 'SERIOUS_ERROR2';

        return SyncPromise.all([
            SyncPromise.resolve(1),
            SyncPromise.reject(new Error(error)),
            SyncPromise.reject(new Error(error2))
        ]).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should call promise.delay and wait some time', () => {

        let timeoutCalled = false;

        let timeout = setTimeout(() => {
            timeoutCalled = true;
        }, 100);

        return SyncPromise.delay(10).then(() => {
            clearTimeout(timeout);
            if (timeoutCalled) {
                throw new Error(`Expected timeout to not be called`);
            }
        }).toPromise();
    });

    it('should work with a set of resolved promises in promise.hash', () => {

        return SyncPromise.hash({
            one: SyncPromise.resolve(1),
            two: SyncPromise.resolve(2),
            three: SyncPromise.resolve(3)
        }).then(({ one, two, three }) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${one}`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${two}`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${three}`);
            }
        }).toPromise();
    });

    it('should work with a set of resolved values or promises in promise.hash', () => {

        return SyncPromise.hash({
            one: 1,
            two: SyncPromise.resolve(2),
            three: 3
        }).then(({ one, two, three }) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${one}`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${two}`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${three}`);
            }
        }).toPromise();
    });

    it('should reject with any rejected promise from promise.hash', () => {

        let error = 'SERIOUS_ERROR';

        return SyncPromise.hash({
            one: SyncPromise.resolve(1),
            two: SyncPromise.reject(new Error(error)),
            three: SyncPromise.resolve(3)
        }).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });

    it('should reject with the first rejected promise from promise.hash', () => {

        let error = 'SERIOUS_ERROR';
        let error2 = 'SERIOUS_ERROR2';

        return SyncPromise.hash({
            one: SyncPromise.resolve(1),
            two: SyncPromise.reject(new Error(error)),
            three: SyncPromise.reject(new Error(error2))
        }).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new Error(`Expected err to be Error type, got ${typeof err}`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        }).toPromise();
    });
});
