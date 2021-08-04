import type { ZalgoPromise } from './promise';
export declare function startActive(): void;
export declare function endActive(): void;
export declare function awaitActive(Zalgo: ZalgoPromise<any>): ZalgoPromise<void>;
