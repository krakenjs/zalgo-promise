/* @flow */

import { getGlobal } from './global';
import type { ZalgoPromise } from './promise';

export function dispatchPossiblyUnhandledError<T>(err : mixed, promise : ZalgoPromise<T>) {

    if (getGlobal().dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    getGlobal().dispatchedErrors.push(err);

    setTimeout(() => {
        if (__DEBUG__) {
            // $FlowFixMe
            throw new Error(`${ err.stack || err.toString() }\n\nFrom promise:\n\n${ promise.stack }`);
        }

        throw err;
    }, 1);

    for (let j = 0; j < getGlobal().possiblyUnhandledPromiseHandlers.length; j++) {
        getGlobal().possiblyUnhandledPromiseHandlers[j](err, promise);
    }
}

export function onPossiblyUnhandledException(handler : (mixed) => void) : { cancel : () => void } {
    getGlobal().possiblyUnhandledPromiseHandlers.push(handler);

    return {
        cancel() {
            getGlobal().possiblyUnhandledPromiseHandlers.splice(getGlobal().possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
        }
    };
}
