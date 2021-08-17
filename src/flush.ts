import type { ZalgoPromise } from './promise';

let activeCount = 0;
let flushPromise: ZalgoPromise<void> | null;

function flushActive() {
    if (!activeCount && flushPromise) {
        const promise = flushPromise;
        flushPromise = null;
        promise.resolve();
    }
}

export function startActive(): void {
    activeCount += 1;
}
export function endActive(): void {
    activeCount -= 1;
    flushActive();
}
export function awaitActive(Zalgo: ZalgoPromise<any>): ZalgoPromise<void> {
    // @ts-ignore
    const promise = (flushPromise = flushPromise || new Zalgo());
    flushActive();
    return promise;
}
