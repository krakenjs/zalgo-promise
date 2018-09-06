/* @flow */

import type { ZalgoPromise } from './promise';

type ZalgoGlobalType = {
    flushPromises : Array<ZalgoPromise<mixed>>,
    activeCount : number,
    possiblyUnhandledPromiseHandlers : Array<<T>(mixed, ZalgoPromise<T>) => void>, // eslint-disable-line no-undef
    dispatchedErrors : Array<mixed>
};

export function getGlobal() : ZalgoGlobalType {

    let glob;

    if (typeof window !== 'undefined') {
        glob = window;
    } else if (typeof global !== 'undefined') {
        glob = global;
    } else {
        throw new TypeError(`Can not find global`);
    }

    let zalgoGlobal = glob.__zalgopromise__ = glob.__zalgopromise__ || {};
    zalgoGlobal.flushPromises = zalgoGlobal.flushPromises || [];
    zalgoGlobal.activeCount = zalgoGlobal.activeCount || 0;
    zalgoGlobal.possiblyUnhandledPromiseHandlers = zalgoGlobal.possiblyUnhandledPromiseHandlers || [];
    zalgoGlobal.dispatchedErrors = zalgoGlobal.dispatchedErrors || [];

    return zalgoGlobal;
}
