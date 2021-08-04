export type ZalgoPromiseConstructorType = (
    resolve: (arg0: unknown) => void,
    reject: (arg0: unknown) => void
) => void;
// export something to force webpack to see this as an ES module
export const TYPES = true;
