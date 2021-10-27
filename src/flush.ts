import type { Class } from 'utility-types';

import type { ZalgoPromise } from './promise';

let activeCount = 0;
let flushPromise : ZalgoPromise<unknown> | null;

function flushActive() : void {
    if (!activeCount && flushPromise) {
        const promise = flushPromise;
        flushPromise = null;
        // @ts-ignore - resolve requires argument
        promise.resolve();
    }
}

export function startActive() : void {
    activeCount += 1;
}

export function endActive() : void {
    activeCount -= 1;
    flushActive();
}

export function awaitActive(Zalgo : Class<ZalgoPromise<unknown>>) : ZalgoPromise<void> {
    const promise = flushPromise = flushPromise || new Zalgo();
    flushActive();
    return promise;
}
