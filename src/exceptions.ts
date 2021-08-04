import type { ZalgoPromise } from './promise';

const dispatchedErrors: Error[] = [];
const possiblyUnhandledPromiseHandlers: Array<
    (arg0: unknown, promise?: ZalgoPromise<unknown>) => void
> = [];
export function dispatchPossiblyUnhandledError<T>(
    err: Error,
    promise: ZalgoPromise<T>
): void {

    // @ts-ignore
    if (dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    // @ts-ignore
    dispatchedErrors.push(err);
    setTimeout(() => {
        // @ts-ignore
        if (__DEBUG__) {
            // $FlowFixMe
            throw new Error(
                `${ err.stack || err.toString() }\n\nFrom promise:\n\n${
                    promise.stack
                }`
            );
        }

        throw err;
    }, 1);

    for (let j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
        // @ts-ignore
        possiblyUnhandledPromiseHandlers[j](err, promise);
    }
}
export function onPossiblyUnhandledException(
    handler: (arg0: unknown, promise?: ZalgoPromise<unknown>) => void
): {
    cancel: () => void
} {
    possiblyUnhandledPromiseHandlers.push(handler);
    return {
        cancel() {
            possiblyUnhandledPromiseHandlers.splice(
                possiblyUnhandledPromiseHandlers.indexOf(handler),
                1
            );
        }
    };
}
