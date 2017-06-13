
let possiblyUnhandledPromiseHandlers = [];
let possiblyUnhandledPromises = [];
let possiblyUnhandledPromiseTimeout;

export function addPossiblyUnhandledPromise(promise) {
    possiblyUnhandledPromises.push(promise);
    possiblyUnhandledPromiseTimeout = possiblyUnhandledPromiseTimeout || setTimeout(flushPossiblyUnhandledPromises, 1);
}

function flushPossiblyUnhandledPromises() {

    possiblyUnhandledPromiseTimeout = null;
    let promises = possiblyUnhandledPromises;
    possiblyUnhandledPromises = [];

    for (let i = 0; i < promises.length; i++) {
        let promise = promises[i];

        if (promise.silentReject) {
            continue;
        }

        promise.handlers.push({
            onError(err) {
                if (promise.silentReject) {
                    return;
                }

                dispatchError(err);
            }
        });

        promise.dispatch();
    }
}

let dispatchedErrors = [];

function dispatchError(err) {

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
