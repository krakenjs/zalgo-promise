/* @flow */

import { SyncPromise } from 'src/index';

describe('happy cases', () => {

    it('should create a resolved promise and get the value', () => {

        let value = 'foobar';

        return SyncPromise.resolve(value).then(result => {
            if (result !== value) {
                throw new Error(`Expected ${result} to be ${value}`);
            }
        });
    });

    it('should create a rejected promise and catch the error', () => {

        let error = 'SERIOUS_ERROR';

        return SyncPromise.reject(new Error(error)).catch(err => {
            if (err.message !== error) {
                throw new Error(`Expected ${err.message} to be ${error}`);
            }
        });
    });
});
