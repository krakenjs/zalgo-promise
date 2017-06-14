!function(root, factory) {
    "object" == typeof exports && "object" == typeof module ? module.exports = factory() : "function" == typeof define && define.amd ? define("zalgo", [], factory) : "object" == typeof exports ? exports.zalgo = factory() : root.zalgo = factory();
}(this, function() {
    return function(modules) {
        function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) return installedModules[moduleId].exports;
            var module = installedModules[moduleId] = {
                i: moduleId,
                l: !1,
                exports: {}
            };
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            module.l = !0;
            return module.exports;
        }
        var installedModules = {};
        __webpack_require__.m = modules;
        __webpack_require__.c = installedModules;
        __webpack_require__.i = function(value) {
            return value;
        };
        __webpack_require__.d = function(exports, name, getter) {
            __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
                configurable: !1,
                enumerable: !0,
                get: getter
            });
        };
        __webpack_require__.n = function(module) {
            var getter = module && module.__esModule ? function() {
                return module.default;
            } : function() {
                return module;
            };
            __webpack_require__.d(getter, "a", getter);
            return getter;
        };
        __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };
        __webpack_require__.p = "";
        return __webpack_require__(__webpack_require__.s = "./src/index.js");
    }({
        "./src/exceptions.js": function(module, exports, __webpack_require__) {
            "use strict";
            function dispatchError(err) {
                if (-1 === dispatchedErrors.indexOf(err)) {
                    dispatchedErrors.push(err);
                    setTimeout(function() {
                        throw err;
                    }, 1);
                    for (var j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) possiblyUnhandledPromiseHandlers[j](err);
                }
            }
            function flushPossiblyUnhandledPromises() {
                possiblyUnhandledPromiseTimeout = null;
                var promises = possiblyUnhandledPromises;
                possiblyUnhandledPromises = [];
                for (var i = 0; i < promises.length; i++) {
                    (function(i) {
                        var promise = promises[i];
                        if (promise.silentReject) return "continue";
                        promise.handlers.push({
                            onError: function(err) {
                                promise.silentReject || dispatchError(err);
                            }
                        });
                        promise.dispatch();
                    })(i);
                }
            }
            function addPossiblyUnhandledPromise(promise) {
                possiblyUnhandledPromises.push(promise);
                possiblyUnhandledPromiseTimeout = possiblyUnhandledPromiseTimeout || setTimeout(flushPossiblyUnhandledPromises, 1);
            }
            function onPossiblyUnhandledException(handler) {
                possiblyUnhandledPromiseHandlers.push(handler);
                return {
                    cancel: function() {
                        possiblyUnhandledPromiseHandlers.splice(possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
                    }
                };
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.addPossiblyUnhandledPromise = addPossiblyUnhandledPromise;
            exports.onPossiblyUnhandledException = onPossiblyUnhandledException;
            var possiblyUnhandledPromiseHandlers = [], possiblyUnhandledPromises = [], possiblyUnhandledPromiseTimeout = void 0, dispatchedErrors = [];
        },
        "./src/index.js": function(module, exports, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            var _promise = __webpack_require__("./src/promise.js");
            Object.keys(_promise).forEach(function(key) {
                "default" !== key && "__esModule" !== key && Object.defineProperty(exports, key, {
                    enumerable: !0,
                    get: function() {
                        return _promise[key];
                    }
                });
            });
        },
        "./src/promise.js": function(module, exports, __webpack_require__) {
            "use strict";
            function _classCallCheck(instance, Constructor) {
                if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.SyncPromise = void 0;
            var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
                return typeof obj;
            } : function(obj) {
                return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            }, _createClass = function() {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || !1;
                        descriptor.configurable = !0;
                        "value" in descriptor && (descriptor.writable = !0);
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }
                return function(Constructor, protoProps, staticProps) {
                    protoProps && defineProperties(Constructor.prototype, protoProps);
                    staticProps && defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }(), _utils = __webpack_require__("./src/utils.js"), _exceptions = __webpack_require__("./src/exceptions.js"), SyncPromise = function() {
                function SyncPromise(handler) {
                    var _this = this;
                    _classCallCheck(this, SyncPromise);
                    this.resolved = !1;
                    this.rejected = !1;
                    this.silentReject = !1;
                    this.handlers = [];
                    (0, _exceptions.addPossiblyUnhandledPromise)(this);
                    handler && (0, _utils.trycatch)(handler, function(res) {
                        return _this.resolve(res);
                    }, function(err) {
                        return _this.reject(err);
                    });
                }
                _createClass(SyncPromise, [ {
                    key: "resolve",
                    value: function(result) {
                        if (this.resolved || this.rejected) return this;
                        if ((0, _utils.isPromise)(result)) throw new Error("Can not resolve promise with another promise");
                        this.resolved = !0;
                        this.value = result;
                        this.dispatch();
                        return this;
                    }
                }, {
                    key: "reject",
                    value: function(error) {
                        if (this.resolved || this.rejected) return this;
                        if ((0, _utils.isPromise)(error)) throw new Error("Can not reject promise with another promise");
                        if (!error) {
                            var _err = error && "function" == typeof error.toString ? error.toString() : Object.prototype.toString.call(error);
                            error = new Error("Expected reject to be called with Error, got " + _err);
                        }
                        this.rejected = !0;
                        this.error = error;
                        this.dispatch();
                        return this;
                    }
                }, {
                    key: "asyncReject",
                    value: function(error) {
                        this.silentReject = !0;
                        this.reject(error);
                    }
                }, {
                    key: "dispatch",
                    value: function() {
                        var _this2 = this;
                        if (this.resolved || this.rejected) for (;this.handlers.length; ) {
                            (function() {
                                var handler = _this2.handlers.shift(), isError = !1, result = void 0, error = void 0;
                                try {
                                    if (_this2.resolved) result = handler.onSuccess ? handler.onSuccess(_this2.value) : _this2.value; else if (_this2.rejected) if (handler.onError) result = handler.onError(_this2.error); else {
                                        isError = !0;
                                        error = _this2.error;
                                    }
                                } catch (err) {
                                    isError = !0;
                                    error = err;
                                }
                                if (result === _this2) throw new Error("Can not return a promise from the the then handler of the same promise");
                                if (!handler.promise) return "continue";
                                isError ? handler.promise.reject(error) : (0, _utils.isPromise)(result) && "object" === (void 0 === result ? "undefined" : _typeof(result)) && null !== result && "function" == typeof result.then ? result.then(function(res) {
                                    handler.promise.resolve(res);
                                }, function(err) {
                                    handler.promise.reject(err);
                                }) : handler.promise.resolve(result);
                            })();
                        }
                    }
                }, {
                    key: "then",
                    value: function(onSuccess, onError) {
                        if (onSuccess && "function" != typeof onSuccess && !onSuccess.call) throw new Error("Promise.then expected a function for success handler");
                        if (onError && "function" != typeof onError && !onError.call) throw new Error("Promise.then expected a function for error handler");
                        var promise = new SyncPromise();
                        this.handlers.push({
                            promise: promise,
                            onSuccess: onSuccess,
                            onError: onError
                        });
                        this.silentReject = !0;
                        this.dispatch();
                        return promise;
                    }
                }, {
                    key: "catch",
                    value: function(onError) {
                        return this.then(void 0, onError);
                    }
                }, {
                    key: "finally",
                    value: function(handler) {
                        return this.then(function(result) {
                            return SyncPromise.try(handler).then(function() {
                                return result;
                            });
                        }, function(err) {
                            return SyncPromise.try(handler).then(function() {
                                throw err;
                            });
                        });
                    }
                }, {
                    key: "toPromise",
                    value: function() {
                        if (!window.Promise) throw new Error("Could not find window.Promise");
                        return window.Promise.resolve(this);
                    }
                } ], [ {
                    key: "resolve",
                    value: function(value) {
                        return (0, _utils.isPromise)(value) || value instanceof SyncPromise ? value : new SyncPromise().resolve(value);
                    }
                }, {
                    key: "reject",
                    value: function(error) {
                        return new SyncPromise().reject(error);
                    }
                }, {
                    key: "all",
                    value: function(promises) {
                        for (var promise = new SyncPromise(), count = promises.length, results = [], i = 0; i < promises.length; i++) !function(i) {
                            var val = promises[i];
                            SyncPromise.resolve(val).then(function(result) {
                                results[i] = result;
                                count -= 1;
                                0 === count && promise.resolve(results);
                            }, function(err) {
                                promise.reject(err);
                            });
                        }(i);
                        count || promise.resolve(results);
                        return promise;
                    }
                }, {
                    key: "onPossiblyUnhandledException",
                    value: function(handler) {
                        return (0, _exceptions.onPossiblyUnhandledException)(handler);
                    }
                }, {
                    key: "try",
                    value: function(method) {
                        return SyncPromise.resolve().then(method);
                    }
                }, {
                    key: "delay",
                    value: function(_delay) {
                        return new SyncPromise(function(resolve) {
                            setTimeout(resolve, _delay);
                        });
                    }
                }, {
                    key: "hash",
                    value: function(obj) {
                        var results = {}, promises = [];
                        for (var key in obj) !function(key) {
                            obj.hasOwnProperty(key) && promises.push(SyncPromise.resolve(obj[key]).then(function(result) {
                                results[key] = result;
                            }));
                        }(key);
                        return SyncPromise.all(promises).then(function() {
                            return results;
                        });
                    }
                } ]);
                return SyncPromise;
            }();
            exports.SyncPromise = SyncPromise;
        },
        "./src/utils.js": function(module, exports, __webpack_require__) {
            "use strict";
            function trycatch(method, successHandler, errorHandler) {
                function flush() {
                    if (isCalled) {
                        if (isError) return errorHandler(err);
                        if (isSuccess) return successHandler(res);
                    }
                }
                var isCalled = !1, isSuccess = !1, isError = !1, err = void 0, res = void 0;
                try {
                    method(function(result) {
                        res = result;
                        isSuccess = !0;
                        flush();
                    }, function(error) {
                        err = error;
                        isError = !0;
                        flush();
                    });
                } catch (error) {
                    return errorHandler(error);
                }
                isCalled = !0;
                flush();
            }
            function isPromise(item) {
                try {
                    if (!item) return !1;
                    if (window.Window && item instanceof window.Window) return !1;
                    if (window.constructor && item instanceof window.constructor) return !1;
                    if (toString) {
                        var name = toString.call(item);
                        if ("[object Window]" === name || "[object global]" === name || "[object DOMWindow]" === name) return !1;
                    }
                    if (item && item.then instanceof Function) return !0;
                } catch (err) {
                    return !1;
                }
                return !1;
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.trycatch = trycatch;
            exports.isPromise = isPromise;
            var toString = {}.toString;
        }
    });
});
//# sourceMappingURL=zalgo-promise.js.map
//# sourceMappingURL=zalgo-promise.js.map