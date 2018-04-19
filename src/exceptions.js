/* @flow */

import { getGlobal } from './global';

export function dispatchPossiblyUnhandledError(err : mixed) {

    if (getGlobal().dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    getGlobal().dispatchedErrors.push(err);

    setTimeout(() => {
        throw err;
    }, 1);

    for (let j = 0; j < getGlobal().possiblyUnhandledPromiseHandlers.length; j++) {
        getGlobal().possiblyUnhandledPromiseHandlers[j](err);
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
