var dispatchedErrors = [];
var possiblyUnhandledPromiseHandlers = [];
export function dispatchPossiblyUnhandledError(err, promise) {
  // @ts-ignore
  if (dispatchedErrors.indexOf(err) !== -1) {
    return;
  } // @ts-ignore


  dispatchedErrors.push(err);
  setTimeout(function () {
    // @ts-ignore
    if (__DEBUG__) {
      // $FlowFixMe
      throw new Error((err.stack || err.toString()) + "\n\nFrom promise:\n\n" + promise.stack);
    }

    throw err;
  }, 1);

  for (var j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) {
    // @ts-ignore
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