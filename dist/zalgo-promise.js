!function(root, factory) {
    "object" == typeof exports && "object" == typeof module ? module.exports = factory() : "function" == typeof define && define.amd ? define("ZalgoPromise", [], factory) : "object" == typeof exports ? exports.ZalgoPromise = factory() : root.ZalgoPromise = factory();
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
        return __webpack_require__(__webpack_require__.s = "./src/export.js");
    }({
        "./src/exceptions.js": function(module, exports, __webpack_require__) {
            "use strict";
            function dispatchPossiblyUnhandledError(err) {
                if (-1 === dispatchedErrors.indexOf(err)) {
                    dispatchedErrors.push(err);
                    setTimeout(function() {
                        throw err;
                    }, 1);
                    for (var j = 0; j < possiblyUnhandledPromiseHandlers.length; j++) possiblyUnhandledPromiseHandlers[j](err);
                }
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
            exports.dispatchPossiblyUnhandledError = dispatchPossiblyUnhandledError;
            exports.onPossiblyUnhandledException = onPossiblyUnhandledException;
            var possiblyUnhandledPromiseHandlers = [], dispatchedErrors = [];
        },
        "./src/export.js": function(module, exports, __webpack_require__) {
            "use strict";
            module.exports = __webpack_require__("./src/promise.js").ZalgoPromise;
            module.exports.ZalgoPromise = __webpack_require__("./src/promise.js").ZalgoPromise;
        },
        "./src/promise.js": function(module, exports, __webpack_require__) {
            "use strict";
            function _classCallCheck(instance, Constructor) {
                if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.ZalgoPromise = void 0;
            var _createClass = function() {
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
            }(), _utils = __webpack_require__("./src/utils.js"), _exceptions = __webpack_require__("./src/exceptions.js"), ZalgoPromise = function() {
                function ZalgoPromise(handler) {
                    var _this = this;
                    _classCallCheck(this, ZalgoPromise);
                    this.resolved = !1;
                    this.rejected = !1;
                    this.errorHandled = !1;
                    this.handlers = [];
                    if (handler) {
                        var _result = void 0, _error = void 0, resolved = !1, rejected = !1, isAsync = !1;
                        try {
                            handler(function(res) {
                                if (isAsync) _this.resolve(res); else {
                                    resolved = !0;
                                    _result = res;
                                }
                            }, function(err) {
                                if (isAsync) _this.reject(err); else {
                                    rejected = !0;
                                    _error = err;
                                }
                            });
                        } catch (err) {
                            this.reject(err);
                            return;
                        }
                        isAsync = !0;
                        resolved ? this.resolve(_result) : rejected && this.reject(_error);
                    }
                }
                _createClass(ZalgoPromise, [ {
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
                        var _this2 = this;
                        if (this.resolved || this.rejected) return this;
                        if ((0, _utils.isPromise)(error)) throw new Error("Can not reject promise with another promise");
                        if (!error) {
                            var _err = error && "function" == typeof error.toString ? error.toString() : Object.prototype.toString.call(error);
                            error = new Error("Expected reject to be called with Error, got " + _err);
                        }
                        this.rejected = !0;
                        this.error = error;
                        this.errorHandled || setTimeout(function() {
                            _this2.errorHandled || (0, _exceptions.dispatchPossiblyUnhandledError)(error);
                        }, 1);
                        this.dispatch();
                        return this;
                    }
                }, {
                    key: "asyncReject",
                    value: function(error) {
                        this.errorHandled = !0;
                        this.reject(error);
                    }
                }, {
                    key: "dispatch",
                    value: function() {
                        var _this3 = this, dispatching = this.dispatching, resolved = this.resolved, rejected = this.rejected, handlers = this.handlers;
                        if (!dispatching && (resolved || rejected)) {
                            this.dispatching = !0;
                            for (var i = 0; i < handlers.length; i++) {
                                (function(i) {
                                    var _handlers$i = handlers[i], onSuccess = _handlers$i.onSuccess, onError = _handlers$i.onError, promise = _handlers$i.promise, result = void 0;
                                    if (resolved) try {
                                        result = onSuccess ? onSuccess(_this3.value) : _this3.value;
                                    } catch (err) {
                                        promise.reject(err);
                                        return "continue";
                                    } else if (rejected) {
                                        if (!onError) {
                                            promise.reject(_this3.error);
                                            return "continue";
                                        }
                                        try {
                                            result = onError(_this3.error);
                                        } catch (err) {
                                            promise.reject(err);
                                            return "continue";
                                        }
                                    }
                                    if (result instanceof ZalgoPromise && (result.resolved || result.rejected)) {
                                        result.resolved ? promise.resolve(result.value) : promise.reject(result.error);
                                        result.errorHandled = !0;
                                    } else (0, _utils.isPromise)(result) ? result.then(function(res) {
                                        promise.resolve(res);
                                    }, function(err) {
                                        promise.reject(err);
                                    }) : promise.resolve(result);
                                })(i);
                            }
                            handlers.length = 0;
                            this.dispatching = !1;
                        }
                    }
                }, {
                    key: "then",
                    value: function(onSuccess, onError) {
                        if (onSuccess && "function" != typeof onSuccess && !onSuccess.call) throw new Error("Promise.then expected a function for success handler");
                        if (onError && "function" != typeof onError && !onError.call) throw new Error("Promise.then expected a function for error handler");
                        var promise = new ZalgoPromise();
                        this.handlers.push({
                            promise: promise,
                            onSuccess: onSuccess,
                            onError: onError
                        });
                        this.errorHandled = !0;
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
                            return ZalgoPromise.try(handler).then(function() {
                                return result;
                            });
                        }, function(err) {
                            return ZalgoPromise.try(handler).then(function() {
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
                        return value instanceof ZalgoPromise || (0, _utils.isPromise)(value) ? value : new ZalgoPromise().resolve(value);
                    }
                }, {
                    key: "reject",
                    value: function(error) {
                        return new ZalgoPromise().reject(error);
                    }
                }, {
                    key: "all",
                    value: function(promises) {
                        var promise = new ZalgoPromise(), count = promises.length, results = [];
                        if (!count) {
                            promise.resolve(results);
                            return promise;
                        }
                        for (var i = 0; i < promises.length; i++) !function(i) {
                            ZalgoPromise.resolve(promises[i]).then(function(result) {
                                results[i] = result;
                                count -= 1;
                                0 === count && promise.resolve(results);
                            }, function(err) {
                                promise.reject(err);
                            });
                        }(i);
                        return promise;
                    }
                }, {
                    key: "map",
                    value: function(promises, method) {
                        var promise = new ZalgoPromise(), count = promises.length, results = [];
                        if (!count) {
                            promise.resolve(results);
                            return promise;
                        }
                        for (var i = 0; i < promises.length; i++) !function(i) {
                            ZalgoPromise.try(function() {
                                return method(promises[i]);
                            }).then(function(result) {
                                results[i] = result;
                                count -= 1;
                                0 === count && promise.resolve(results);
                            }, function(err) {
                                promise.reject(err);
                            });
                        }(i);
                        return promise;
                    }
                }, {
                    key: "onPossiblyUnhandledException",
                    value: function(handler) {
                        return (0, _exceptions.onPossiblyUnhandledException)(handler);
                    }
                }, {
                    key: "try",
                    value: function(method, context, args) {
                        var result = void 0;
                        try {
                            result = method.apply(context, args || []);
                        } catch (err) {
                            return ZalgoPromise.reject(err);
                        }
                        return ZalgoPromise.resolve(result);
                    }
                }, {
                    key: "delay",
                    value: function(_delay) {
                        return new ZalgoPromise(function(resolve) {
                            setTimeout(resolve, _delay);
                        });
                    }
                }, {
                    key: "hash",
                    value: function(obj) {
                        var results = {}, promises = [];
                        for (var key in obj) !function(key) {
                            obj.hasOwnProperty(key) && promises.push(ZalgoPromise.resolve(obj[key]).then(function(result) {
                                results[key] = result;
                            }));
                        }(key);
                        return ZalgoPromise.all(promises).then(function() {
                            return results;
                        });
                    }
                }, {
                    key: "isPromise",
                    value: function(value) {
                        return !!(value && value instanceof ZalgoPromise) || (0, _utils.isPromise)(value);
                    }
                } ]);
                return ZalgoPromise;
            }();
            exports.ZalgoPromise = ZalgoPromise;
        },
        "./src/utils.js": function(module, exports, __webpack_require__) {
            "use strict";
            function isPromise(item) {
                try {
                    if (!item) return !1;
                    if (window.Promise && item instanceof window.Promise) return !0;
                    if (window.Window && item instanceof window.Window) return !1;
                    if (window.constructor && item instanceof window.constructor) return !1;
                    if (toString) {
                        var name = toString.call(item);
                        if ("[object Window]" === name || "[object global]" === name || "[object DOMWindow]" === name) return !1;
                    }
                    if (item.then instanceof Function) return !0;
                } catch (err) {
                    return !1;
                }
                return !1;
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.isPromise = isPromise;
            var toString = {}.toString;
        }
    });
});
//# sourceMappingURL=zalgo-promise.js.map
//# sourceMappingURL=zalgo-promise.js.map