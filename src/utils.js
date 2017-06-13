
export function trycatch(method, successHandler, errorHandler) {

    let isCalled = false;
    let isSuccess = false;
    let isError = false;
    let err, res;

    function flush() {
        if (isCalled) {
            if (isError) {
                return errorHandler(err);
            } else if (isSuccess) {
                return successHandler(res);
            }
        }
    }

    try {
        method(function(result) {
            res = result;
            isSuccess = true;
            flush();
        }, function(error) {
            err = error;
            isError = true;
            flush();
        });
    } catch (error) {
        return errorHandler(error);
    }

    isCalled = true;
    flush();
}

let toString = ({}).toString;

export function isPromise(item) {
    try {
        if (!item) {
            return false;
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

        if (item && item.then instanceof Function) {
            return true;
        }
    } catch (err) {
        return false
    }

    return false
}
