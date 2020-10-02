/* @flow */

import type { ZalgoPromise } from './promise';

const dispatchedErrors = [];
const possiblyUnhandledPromiseHandlers : Array<(mixed, promise? : ZalgoPromise<mixed>) => void> = [];

export function dispatchPossiblyUnhandledError<T>(err : mixed, promise : ZalgoPromise<T>) {

    if (dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    dispatchedErrors.push(err);

    setTimeout(() => {
        if (__DEBUG__) {
            // $FlowFixMe
            throw new Error(`${ err.stack || err.toString() }\n\nFrom promise:\n\n${ promise.stack }`);
        }

        throw err;
    }, 1);

    for (let j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
        // $FlowFixMe
        possiblyUnhandledPromiseHandlers[j](err, promise);
    }
}

export function onPossiblyUnhandledException(handler : (mixed, promise? : ZalgoPromise<mixed>) => void) : {| cancel : () => void |} {
    possiblyUnhandledPromiseHandlers.push(handler);

    return {
        cancel() {
            possiblyUnhandledPromiseHandlers.splice(possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
        }
    };
}
