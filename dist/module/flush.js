var activeCount = 0;
var flushPromise;

function flushActive() {
  if (!activeCount && flushPromise) {
    var promise = flushPromise;
    flushPromise = null;
    promise.resolve();
  }
}

export function startActive() {
  activeCount += 1;
}
export function endActive() {
  activeCount -= 1;
  flushActive();
}
export function awaitActive(Zalgo) {
  // @ts-ignore
  var promise = flushPromise = flushPromise || new Zalgo();
  flushActive();
  return promise;
}