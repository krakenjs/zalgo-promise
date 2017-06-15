
let possiblyUnhandledPromiseHandlers = [];
let dispatchedErrors = [];

export function dispatchPossiblyUnhandledError(err) {

    if (dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    dispatchedErrors.push(err);

    setTimeout(() => {
        throw err;
    }, 1);

    for (let j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
        possiblyUnhandledPromiseHandlers[j](err);
    }
}

export function onPossiblyUnhandledException(handler) {
    possiblyUnhandledPromiseHandlers.push(handler);

    return {
        cancel() {
            possiblyUnhandledPromiseHandlers.splice(possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
        }
    };
}
