export function getGlobal() {

    var glob = void 0;

    if (typeof window !== 'undefined') {
        glob = window;
    } else if (typeof global !== 'undefined') {
        glob = global;
    } else {
        throw new TypeError('Can not find global');
    }

    var zalgoGlobal = glob.__zalgopromise__ = glob.__zalgopromise__ || {};
    zalgoGlobal.flushPromises = zalgoGlobal.flushPromises || [];
    zalgoGlobal.activeCount = zalgoGlobal.activeCount || 0;
    zalgoGlobal.possiblyUnhandledPromiseHandlers = zalgoGlobal.possiblyUnhandledPromiseHandlers || [];
    zalgoGlobal.dispatchedErrors = zalgoGlobal.dispatchedErrors || [];

    return zalgoGlobal;
}