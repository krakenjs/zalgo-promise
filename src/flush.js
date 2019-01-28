/* @flow */

import type { ZalgoPromise } from './promise';

let activeCount = 0;
let flushPromise;

function flushActive() {
    if (!activeCount && flushPromise) {
        const promise = flushPromise;
        flushPromise = null;
        promise.resolve();
    }
}

export function startActive() {
    activeCount += 1;
}

export function endActive() {
    activeCount -= 1;
    flushActive();
}

export function awaitActive(Zalgo : ZalgoPromise) : ZalgoPromise<void> {
    let promise = flushPromise = flushPromise || new Zalgo();
    flushActive();
    return promise;
}
