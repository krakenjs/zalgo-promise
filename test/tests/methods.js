/* @flow */

import { ZalgoPromise } from '../../src';

describe('promise method cases', () => {

    it('should work with a set of resolved promises in promise.all', () => {

        return ZalgoPromise.all([
            ZalgoPromise.resolve(1),
            ZalgoPromise.resolve(2),
            ZalgoPromise.resolve(3)
        ]).then(([ one, two, three ]) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${ one }`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
        }).toPromise();
    });

    it('should work with a set of resolved values or promises in promise.all', () => {

        return ZalgoPromise.all([
            1,
            ZalgoPromise.resolve(2),
            3
        ]).then(([ one, two, three ]) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${ one }`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
        }).toPromise();
    });

    it('should reject with any rejected promise from promise.all', () => {

        const error = 'SERIOUS_ERROR';

        return ZalgoPromise.all([
            ZalgoPromise.resolve(1),
            ZalgoPromise.reject(new Error(error)),
            ZalgoPromise.resolve(3)
        ]).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new TypeError(`Expected err to be Error type, got ${ typeof err }`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${ err.message } to be ${ error }`);
            }
        }).toPromise();
    });

    it('should reject with the first rejected promise from promise.all', () => {

        const error = 'SERIOUS_ERROR';
        const error2 = 'SERIOUS_ERROR2';

        return ZalgoPromise.all([
            ZalgoPromise.resolve(1),
            ZalgoPromise.reject(new Error(error)),
            ZalgoPromise.reject(new Error(error2))
        ]).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new TypeError(`Expected err to be Error type, got ${ typeof err }`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${ err.message } to be ${ error }`);
            }
        }).toPromise();
    });

    it('should call promise.delay and wait some time', () => {

        let timeoutCalled = false;

        const timeout = setTimeout(() => {
            timeoutCalled = true;
        }, 100);

        return ZalgoPromise.delay(10).then(() => {
            clearTimeout(timeout);
            if (timeoutCalled) {
                throw new Error(`Expected timeout to not be called`);
            }
        }).toPromise();
    });

    it('should work with a set of resolved promises in promise.hash', () => {

        return ZalgoPromise.hash({
            one:   ZalgoPromise.resolve(1),
            two:   ZalgoPromise.resolve(2),
            three: ZalgoPromise.resolve(3)
        }).then(({ one, two, three }) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${ one }`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
        }).toPromise();
    });

    it('should work with a set of resolved values or promises in promise.hash', () => {

        return ZalgoPromise.hash({
            one:   1,
            two:   ZalgoPromise.resolve(2),
            three: 3
        }).then(({ one, two, three }) => {
            if (one !== 1) {
                throw new Error(`Expected 1, got ${ one }`);
            }
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
        }).toPromise();
    });

    it('should reject with any rejected promise from promise.hash', () => {

        const error = 'SERIOUS_ERROR';

        return ZalgoPromise.hash({
            one:   ZalgoPromise.resolve(1),
            two:   ZalgoPromise.reject(new Error(error)),
            three: ZalgoPromise.resolve(3)
        }).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new TypeError(`Expected err to be Error type, got ${ typeof err }`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${ err.message } to be ${ error }`);
            }
        }).toPromise();
    });

    it('should reject with the first rejected promise from promise.hash', () => {

        const error = 'SERIOUS_ERROR';
        const error2 = 'SERIOUS_ERROR2';

        return ZalgoPromise.hash({
            one:   ZalgoPromise.resolve(1),
            two:   ZalgoPromise.reject(new Error(error)),
            three: ZalgoPromise.reject(new Error(error2))
        }).then(() => {
            throw new Error(`Expected then to not be called`);
        }).catch(err => {
            if (!(err instanceof Error)) {
                throw new TypeError(`Expected err to be Error type, got ${ typeof err }`);
            }
            if (err.message !== error) {
                throw new Error(`Expected ${ err.message } to be ${ error }`);
            }
        }).toPromise();
    });


    it('should work with a set of values in promise.map', () => {

        return ZalgoPromise.map([
            1,
            2,
            3
        ], x => x + 1).then(([ two, three, four ]) => {
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
            if (four !== 4) {
                throw new Error(`Expected 4, got ${ four }`);
            }
        }).toPromise();
    });

    it('should work with a set of values and a promise returning function in promise.map', () => {

        return ZalgoPromise.map([
            1,
            2,
            3
        ], x => ZalgoPromise.resolve(x + 1)).then(([ two, three, four ]) => {
            if (two !== 2) {
                throw new Error(`Expected 2, got ${ two }`);
            }
            if (three !== 3) {
                throw new Error(`Expected 3, got ${ three }`);
            }
            if (four !== 4) {
                throw new Error(`Expected 4, got ${ four }`);
            }
        }).toPromise();
    });

    it('should work with a simple method passed to promise.try', () => {

        const value = 'foobar';

        return ZalgoPromise.try(() => {
            return value;
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });

    it('should work with a conditional method passed to promise.try', () => {

        const value = 'foobar';

        return ZalgoPromise.try(() => {
            if (value === 'foobar') {
                return value;
            }
        }).then(result => {
            if (result && result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });

    it('should work with a promise returning method passed to promise.try', () => {

        const value = 'foobar';

        return ZalgoPromise.try(() => {
            return ZalgoPromise.resolve(value);
        }).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });

    it('should work with a conditional promise returning method passed to promise.try', () => {

        const value = 'foobar';

        return ZalgoPromise.try(() => {
            if (value === 'foobar') {
                return ZalgoPromise.resolve(value);
            }
        }).then(result => {
            if (result && result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });

    it('should work with a conditional promise returning method passed to promise.try, with an inner promise.try', () => {

        const value = 'foobar';

        return ZalgoPromise.try(() => {
            if (value === 'foobar') {
                return ZalgoPromise.try(() => {
                    return value;
                });
            }
        }).then(result => {
            if (result && result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });

    it('should work with a conditional promise returning method passed to promise.try, calling an external function', () => {

        const value = 'foobar';

        function getValue() : ZalgoPromise<string> {
            return ZalgoPromise.try(() => {
                return value;
            });
        }
        return ZalgoPromise.try(() => {
            if (value === 'foobar') {
                // $FlowFixMe
                return getValue();
            }
        }).then(result => {
            if (result && result !== value) {
                throw new Error(`Expected ${ result } to equal ${ value }`);
            }
        }).toPromise();
    });
});
