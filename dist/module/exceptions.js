var dispatchedErrors = [];
var possiblyUnhandledPromiseHandlers = [];
export function dispatchPossiblyUnhandledError(err, promise) {
  if (dispatchedErrors.indexOf(err) !== -1) {
    return;
  }

  dispatchedErrors.push(err);
  setTimeout(function () {
    if (__DEBUG__) {
      // $FlowFixMe
      throw new Error((err.stack || err.toString()) + "\n\nFrom promise:\n\n" + promise.stack);
    }

    throw err;
  }, 1);

  for (var j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
    // $FlowFixMe
    possiblyUnhandledPromiseHandlers[j](err, promise);
  }
}
export function onPossiblyUnhandledException(handler) {
  possiblyUnhandledPromiseHandlers.push(handler);
  return {
    cancel: function cancel() {
      possiblyUnhandledPromiseHandlers.splice(possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
    }
  };
}