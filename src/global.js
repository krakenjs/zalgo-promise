/* @flow */

import type { ZalgoPromise } from './promise';

type ZalgoGlobalType = {
    flushPromises : Array<ZalgoPromise<mixed>>,
    activeCount : number,
    possiblyUnhandledPromiseHandlers : Array<(mixed) => void>,
    dispatchedErrors : Array<mixed>
};

export function getGlobal() : ZalgoGlobalType {

    if (!window.__zalgopromise__) {
        window.__zalgopromise__ = {
            flushPromises: [],
            activeCount: 0,
            possiblyUnhandledPromiseHandlers: [],
            dispatchedErrors: []
        };
    }

    return window.__zalgopromise__;
}