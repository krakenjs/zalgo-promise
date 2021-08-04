export declare class ZalgoPromise<R extends unknown> {
    resolved: boolean;
    rejected: boolean;
    errorHandled: boolean;
    value?: R;
    error: unknown;
    handlers: Array<{
        promise: ZalgoPromise<any>;
        onSuccess: void | ((result: R) => unknown);
        onError: void | ((error: unknown) => unknown);
    }>;
    dispatching?: boolean;
    stack?: string;
    constructor(handler?: (resolve: (result: R) => void, reject: (error: unknown) => void) => void);
    resolve(result: R): ZalgoPromise<R>;
    reject(error: unknown): ZalgoPromise<R>;
    asyncReject(error: unknown): ZalgoPromise<R>;
    dispatch(): void;
    then<X extends unknown, Y extends unknown>(onSuccess: void | ((result: R) => ZalgoPromise<X> | Y), onError: void | ((error: unknown) => ZalgoPromise<X> | Y)): ZalgoPromise<X | Y>;
    catch<X extends unknown, Y extends unknown>(onError: (error: unknown) => ZalgoPromise<X> | Y): ZalgoPromise<X | Y>;
    finally(onFinally: () => unknown): ZalgoPromise<R>;
    timeout(time: number, err: Error | null | undefined): ZalgoPromise<R>;
    toPromise(): Promise<R>;
    static resolve<X extends unknown>(value: X | ZalgoPromise<X>): ZalgoPromise<X>;
    static reject(error: unknown): ZalgoPromise<unknown>;
    static asyncReject(error: unknown): ZalgoPromise<unknown>;
    static all<X extends ReadonlyArray<unknown>>(promises: X): ZalgoPromise<unknown>;
    static hash<O extends Record<string, any>>(promises: O): ZalgoPromise<any>;
    static map<T, X>(items: ReadonlyArray<T>, method: (arg0: T) => ZalgoPromise<X> | X): ZalgoPromise<ReadonlyArray<X>>;
    static onPossiblyUnhandledException(handler: (err: unknown) => void): {
        cancel: () => void;
    };
    static try<X extends unknown, Y extends unknown, C extends unknown, A extends ReadonlyArray<unknown>>(method: (...args: A) => ZalgoPromise<X> | Y, context?: C, args?: A): ZalgoPromise<X | Y>;
    static delay(delay: number): ZalgoPromise<void>;
    static isPromise(value: unknown): boolean;
    static flush(): ZalgoPromise<void>;
}
