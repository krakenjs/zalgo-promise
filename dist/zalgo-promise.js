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
        "./node_modules/webpack/buildin/global.js": function(module, exports, __webpack_require__) {
            "use strict";
            var g, _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
                return typeof obj;
            } : function(obj) {
                return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            g = function() {
                return this;
            }();
            try {
                g = g || Function("return this")() || (0, eval)("this");
            } catch (e) {
                "object" === ("undefined" == typeof window ? "undefined" : _typeof(window)) && (g = window);
            }
            module.exports = g;
        },
        "./src/exceptions.js": function(module, exports, __webpack_require__) {
            "use strict";
            function dispatchPossiblyUnhandledError(err) {
                if (-1 === (0, _global.getGlobal)().dispatchedErrors.indexOf(err)) {
                    (0, _global.getGlobal)().dispatchedErrors.push(err);
                    setTimeout(function() {
                        throw err;
                    }, 1);
                    for (var j = 0; j < (0, _global.getGlobal)().possiblyUnhandledPromiseHandlers.length; j++) (0, 
                    _global.getGlobal)().possiblyUnhandledPromiseHandlers[j](err);
                }
            }
            function onPossiblyUnhandledException(handler) {
                (0, _global.getGlobal)().possiblyUnhandledPromiseHandlers.push(handler);
                return {
                    cancel: function() {
                        (0, _global.getGlobal)().possiblyUnhandledPromiseHandlers.splice((0, _global.getGlobal)().possiblyUnhandledPromiseHandlers.indexOf(handler), 1);
                    }
                };
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.dispatchPossiblyUnhandledError = dispatchPossiblyUnhandledError;
            exports.onPossiblyUnhandledException = onPossiblyUnhandledException;
            var _global = __webpack_require__("./src/global.js");
        },
        "./src/export.js": function(module, exports, __webpack_require__) {
            "use strict";
            module.exports = __webpack_require__("./src/promise.js").ZalgoPromise;
            module.exports.ZalgoPromise = __webpack_require__("./src/promise.js").ZalgoPromise;
        },
        "./src/global.js": function(module, exports, __webpack_require__) {
            "use strict";
            (function(global) {
                function getGlobal() {
                    var glob = void 0;
                    if ("undefined" != typeof window) glob = window; else {
                        if (void 0 === global) throw new Error("Can not find global");
                        glob = global;
                    }
                    var zalgoGlobal = glob.__zalgopromise__ = glob.__zalgopromise__ || {};
                    zalgoGlobal.flushPromises = zalgoGlobal.flushPromises || [];
                    zalgoGlobal.activeCount = zalgoGlobal.activeCount || 0;
                    zalgoGlobal.possiblyUnhandledPromiseHandlers = zalgoGlobal.possiblyUnhandledPromiseHandlers || [];
                    zalgoGlobal.dispatchedErrors = zalgoGlobal.dispatchedErrors || [];
                    return zalgoGlobal;
                }
                Object.defineProperty(exports, "__esModule", {
                    value: !0
                });
                exports.getGlobal = getGlobal;
            }).call(exports, __webpack_require__("./node_modules/webpack/buildin/global.js"));
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
            }(), _utils = __webpack_require__("./src/utils.js"), _exceptions = __webpack_require__("./src/exceptions.js"), _global = __webpack_require__("./src/global.js"), ZalgoPromise = function() {
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
                            (0, _global.getGlobal)().activeCount += 1;
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
                                    } else (0, _utils.isPromise)(result) ? result instanceof ZalgoPromise && (result.resolved || result.rejected) ? result.resolved ? promise.resolve(result.value) : promise.reject(result.error) : result.then(function(res) {
                                        promise.resolve(res);
                                    }, function(err) {
                                        promise.reject(err);
                                    }) : promise.resolve(result);
                                })(i);
                            }
                            handlers.length = 0;
                            this.dispatching = !1;
                            (0, _global.getGlobal)().activeCount -= 1;
                            0 === (0, _global.getGlobal)().activeCount && ZalgoPromise.flushQueue();
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
                    key: "timeout",
                    value: function(time, err) {
                        var _this4 = this;
                        if (this.resolved || this.rejected) return this;
                        var timeout = setTimeout(function() {
                            _this4.resolved || _this4.rejected || _this4.reject(err || new Error("Promise timed out after " + time + "ms"));
                        }, time);
                        return this.then(function(result) {
                            clearTimeout(timeout);
                            return result;
                        });
                    }
                }, {
                    key: "toPromise",
                    value: function() {
                        if ("undefined" == typeof Promise) throw new Error("Could not find Promise");
                        return Promise.resolve(this);
                    }
                } ], [ {
                    key: "resolve",
                    value: function(value) {
                        return value instanceof ZalgoPromise ? value : (0, _utils.isPromise)(value) ? new ZalgoPromise(function(resolve, reject) {
                            return value.then(resolve, reject);
                        }) : new ZalgoPromise().resolve(value);
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
                        for (var i = 0; i < promises.length; i++) {
                            (function(i) {
                                var prom = promises[i];
                                if (prom instanceof ZalgoPromise) {
                                    if (prom.resolved) {
                                        results[i] = prom.value;
                                        count -= 1;
                                        return "continue";
                                    }
                                } else if (!(0, _utils.isPromise)(prom)) {
                                    results[i] = prom;
                                    count -= 1;
                                    return "continue";
                                }
                                ZalgoPromise.resolve(prom).then(function(result) {
                                    results[i] = result;
                                    count -= 1;
                                    0 === count && promise.resolve(results);
                                }, function(err) {
                                    promise.reject(err);
                                });
                            })(i);
                        }
                        0 === count && promise.resolve(results);
                        return promise;
                    }
                }, {
                    key: "hash",
                    value: function(promises) {
                        var result = {};
                        return ZalgoPromise.all(Object.keys(promises).map(function(key) {
                            return ZalgoPromise.resolve(promises[key]).then(function(value) {
                                result[key] = value;
                            });
                        })).then(function() {
                            return result;
                        });
                    }
                }, {
                    key: "map",
                    value: function(items, method) {
                        return ZalgoPromise.all(items.map(method));
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
                    key: "isPromise",
                    value: function(value) {
                        return !!(value && value instanceof ZalgoPromise) || (0, _utils.isPromise)(value);
                    }
                }, {
                    key: "flush",
                    value: function() {
                        var promise = new ZalgoPromise();
                        (0, _global.getGlobal)().flushPromises.push(promise);
                        0 === (0, _global.getGlobal)().activeCount && ZalgoPromise.flushQueue();
                        return promise;
                    }
                }, {
                    key: "flushQueue",
                    value: function() {
                        var promisesToFlush = (0, _global.getGlobal)().flushPromises;
                        (0, _global.getGlobal)().flushPromises = [];
                        for (var _iterator = promisesToFlush, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
                            var _ref;
                            if (_isArray) {
                                if (_i >= _iterator.length) break;
                                _ref = _iterator[_i++];
                            } else {
                                _i = _iterator.next();
                                if (_i.done) break;
                                _ref = _i.value;
                            }
                            _ref.resolve();
                        }
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
                    if ("undefined" != typeof Promise && item instanceof Promise) return !0;
                    if ("undefined" != typeof window && window.Window && item instanceof window.Window) return !1;
                    if ("undefined" != typeof window && window.constructor && item instanceof window.constructor) return !1;
                    var _toString = {}.toString;
                    if (_toString) {
                        var name = _toString.call(item);
                        if ("[object Window]" === name || "[object global]" === name || "[object DOMWindow]" === name) return !1;
                    }
                    if ("function" == typeof item.then) return !0;
                } catch (err) {
                    return !1;
                }
                return !1;
            }
            Object.defineProperty(exports, "__esModule", {
                value: !0
            });
            exports.isPromise = isPromise;
        }
    });
});
//# sourceMappingURL=zalgo-promise.js.map
//# sourceMappingURL=zalgo-promise.js.map