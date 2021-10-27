export function isPromise(item : unknown) : boolean {
    try {
        if (!item) {
            return false;
        }

        if (typeof Promise !== 'undefined' && item instanceof Promise) {
            return true;
        }

        if (typeof window !== 'undefined' && typeof window.Window === 'function' && item instanceof window.Window) {
            return false;
        }

        if (typeof window !== 'undefined' && typeof window.constructor === 'function' && item instanceof window.constructor) {
            return false;
        }

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const toString = {}.toString;

        if (toString) {
            const name = toString.call(item);

            if (name === '[object Window]' || name === '[object global]' || name === '[object DOMWindow]') {
                return false;
            }
        }

        // @ts-ignore - write a guard for thenable
        if (typeof item.then === 'function') {
            return true;
        }
    } catch (err) {
        return false;
    }

    return false;
}
