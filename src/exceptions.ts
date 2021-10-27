import type { ZalgoPromise } from './promise';

type TypeHandler<T> = (a : unknown, promise ?: ZalgoPromise<T>) => void;
type TypeHandlers<T> = Array<TypeHandler<T>>;

const dispatchedErrors : Array<Error> = [];
// need to somehow supply matching T from function invoke
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const possiblyUnhandledPromiseHandlers : TypeHandlers<any> = [];

export function dispatchPossiblyUnhandledError<T>(err : Error, promise : ZalgoPromise<T>) : void {
    if (dispatchedErrors.indexOf(err) !== -1) {
        return;
    }

    dispatchedErrors.push(err);

    setTimeout(() => {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        if (__DEBUG__) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            throw new Error(`${ err.stack ?? err.toString() }\n\nFrom promise:\n\n${ promise.stack }`);
        }

        throw err;
    }, 1);

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
        possiblyUnhandledPromiseHandlers[j](err, promise);
    }
}

export function onPossiblyUnhandledException<T>(handler : TypeHandler<T>) : { cancel : () => void } {
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
