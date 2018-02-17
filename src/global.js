/* @flow */

import type { ZalgoPromise } from './promise';

type ZalgoGlobalType = {
    flushPromises : Array<ZalgoPromise<mixed>>,
    activeCount : number
};

export function getGlobal() : ZalgoGlobalType {

    if (!window.__zalgopromise__) {
        window.__zalgopromise__ = {
            flushPromises: [],
            activeCount: 0
        };
    }

    return window.__zalgopromise__;
}