/* @flow */

import type { ZalgoPromise } from './promise';

type ZalgoGlobalType = {
    flushPromises : Array<ZalgoPromise<mixed>>,
    activeCount : number,
    possiblyUnhandledPromiseHandlers : Array<(mixed) => void>,
    dispatchedErrors : Array<mixed>
};

export function getGlobal() : ZalgoGlobalType {

    let glob;

    if (typeof window !== 'undefined') {
        glob = window;
    } else if (typeof global !== 'undefined') {
        glob = global;
    } else {
        throw new Error(`Can not find global`);
    }

    if (!glob.__zalgopromise__) {
        glob.__zalgopromise__ = {
            flushPromises: [],
            activeCount: 0,
            possiblyUnhandledPromiseHandlers: [],
            dispatchedErrors: []
        };
    }

    return glob.__zalgopromise__;
}