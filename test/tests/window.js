/* @flow */

import { SyncPromise } from 'src/index';

describe('window cases', () => {

    it('should not access or call then if passed a window object', () => {

        let value = 'foobar';

        let windowThenAccessed = false;
        let windowThenCalled = false;

        Object.defineProperty(window, 'then', {
            configurable: true,
            get() {
                windowThenAccessed = true;
                return () => {
                    windowThenCalled = true;
                }
            }
        });

        return SyncPromise.resolve(value).then(result => {
            return window;
        }).then(result => {
            delete window.then;
            if (result !== window) {
                throw new Error(`Expected result to be window`);
            }
            if (windowThenCalled) {
                throw new Error(`Expected window.then to not be called`);
            }
            if (windowThenAccessed) {
                throw new Error(`Expected window.then to not be accessed`);
            }
        });
    });

    it('should not access or call then if passed a foreign window object', () => {

        let value = 'foobar';

        let windowThenAccessed = false;
        let windowThenCalled = false;

        Object.defineProperty(window.parent, 'then', {
            configurable: true,
            get() {
                windowThenAccessed = true;
                return () => {
                    windowThenCalled = true;
                }
            }
        });

        return SyncPromise.resolve(value).then(result => {
            return window.parent;
        }).then(result => {
            delete window.parent.then;
            if (result !== window.parent) {
                throw new Error(`Expected result to be window`);
            }
            if (windowThenCalled) {
                throw new Error(`Expected window.then to not be called`);
            }
            if (windowThenAccessed) {
                throw new Error(`Expected window.then to not be accessed`);
            }
        });
    });

    it('should not access or call then if passed an instance of window.constructor', () => {

        let value = 'foobar';

        let windowThenAccessed = false;
        let windowThenCalled = false;

        window.constructor = function() {};
        let win = new window.constructor();

        Object.defineProperty(win, 'then', {
            configurable: true,
            get() {
                windowThenAccessed = true;
                return () => {
                    windowThenCalled = true;
                }
            }
        });

        return SyncPromise.resolve(value).then(result => {
            return win;
        }).then(result => {
            delete window.constructor;
            if (result !== win) {
                throw new Error(`Expected result to be window`);
            }
            if (windowThenCalled) {
                throw new Error(`Expected window.then to not be called`);
            }
            if (windowThenAccessed) {
                throw new Error(`Expected window.then to not be accessed`);
            }
        });
    });

    it('should not access or call then if passed a window object where accessing then throws an error', () => {

        let value = 'foobar';

        let win = {};

        Object.defineProperty(win, 'then', {
            configurable: true,
            get() {
                throw new Error(`Can not access .then`);
            }
        });

        return SyncPromise.resolve(value).then(result => {
            return win;
        }).then(result => {
            if (result !== win) {
                throw new Error(`Expected result to be window`);
            }
        });
    });
});
