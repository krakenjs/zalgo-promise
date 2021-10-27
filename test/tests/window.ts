import { ZalgoPromise } from '../../src';

describe('window cases', () => {

    it('should not access or call then if passed a window object', () => {

        const value = 'foobar';

        let windowThenAccessed = false;
        let windowThenCalled = false;

        Object.defineProperty(window, 'then', {
            configurable: true,
            get:          () => {
                windowThenAccessed = true;
                return () => {
                    windowThenCalled = true;
                };
            }
        });

        return ZalgoPromise.resolve(value).then(() => {
            return window;
        }).then(result => {
            // @ts-ignore window.then is required
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
        }).toPromise();
    });

    it('should not access or call then if passed an instance of window.constructor', () => {
        const value = 'foobar';

        let windowThenAccessed = false;
        let windowThenCalled = false;

        window.constructor = class {};
        // @ts-ignore window.constructor is a constructor
        const win = new window.constructor();

        Object.defineProperty(win, 'then', {
            configurable: true,
            get:          () => {
                windowThenAccessed = true;
                return () => {
                    windowThenCalled = true;
                };
            }
        });

        return ZalgoPromise.resolve(value).then(() => {
            return win;
        }).then(result => {
            // @ts-ignore window.constructor is required
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
        }).toPromise();
    });

    it('should not access or call then if passed a window object where accessing then throws an error', () => {

        const value = 'foobar';
        const win = {};

        Object.defineProperty(win, 'then', {
            configurable: true,

            get() {
                throw new Error(`Can not access .then`);
            }

        });

        return ZalgoPromise.resolve(value).then(() => {
            return win;
        }).then(result => {
            if (result !== win) {
                throw new Error(`Expected result to be window`);
            }
        }).toPromise();
    });
});
