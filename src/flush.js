/* @flow */

import type { ZalgoPromise } from "./promise";

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

// eslint-disable-next-line no-undef
export function awaitActive(Zalgo: Class<ZalgoPromise<*>>): ZalgoPromise<void> {
  const promise = (flushPromise = flushPromise || new Zalgo());
  flushActive();
  return promise;
}
