
let toString = ({}).toString;

export function isPromise(item) {
    try {
        if (!item) {
            return false;
        }

        if (window.Promise && item instanceof window.Promise) {
            return true;
        }

        if (window.Window && item instanceof window.Window) {
            return false;
        }

        if (window.constructor && item instanceof window.constructor) {
            return false;
        }

        if (toString) {
            let name = toString.call(item);

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
