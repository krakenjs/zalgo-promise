import { getGlobal } from './global';


export function dispatchPossiblyUnhandledError(err, promise) {

    if (getGlobal().dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    getGlobal().dispatchedErrors.push(err);

    setTimeout(function () {
        if (__DEBUG__) {
            // $FlowFixMe
            throw new Error((err.stack || err.toString()) + '\n\nFrom promise:\n\n' + promise.stack);
        }

        throw err;
    }, 1);

    for (var j = 0; j < getGlobal().possiblyUnhandledPromiseHandlers.length; j++) {
        getGlobal().possiblyUnhandledPromiseHandlers[j](err, promise);
    }
}

export function onPossiblyUnhandledException(handler) {
    getGlobal().possiblyUnhandledPromiseHandlers.push(handler);

    return {
        cancel: function cancel() {
            getGlobal().possiblyUnhandledPromiseHandlers.splice(getGlobal().possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
        }
    };
}