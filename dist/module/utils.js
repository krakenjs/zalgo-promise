export function isPromise(item) {
    try {
        if (!item) {
            return false;
        }

        if (typeof Promise !== 'undefined' && item instanceof Promise) {
            return true;
        }

        if (typeof window !== 'undefined' && window.Window && item instanceof window.Window) {
            return false;
        }

        if (typeof window !== 'undefined' && window.constructor && item instanceof window.constructor) {
            return false;
        }

        var _toString = {}.toString;

        if (_toString) {
            var name = _toString.call(item);

            if (name === '[object Window]' || name === '[object global]' || name === '[object DOMWindow]') {
                return false;
            }
        }

        if (typeof item.then === 'function') {
            return true;
        }
    } catch (err) {
        return false;
    }

    return false;
}