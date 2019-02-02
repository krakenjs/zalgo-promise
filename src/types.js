/* @flow */

export type ZalgoPromiseConstructorType =
    (resolve : (mixed) => void, reject : (mixed) => void) => void;

// export something to force webpack to see this as an ES module
export const TYPES = true;
