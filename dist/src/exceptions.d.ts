import type { ZalgoPromise } from './promise';
export declare function dispatchPossiblyUnhandledError<T>(err: Error, promise: ZalgoPromise<T>): void;
export declare function onPossiblyUnhandledException(handler: (arg0: unknown, promise?: ZalgoPromise<unknown>) => void): {
    cancel: () => void;
};
