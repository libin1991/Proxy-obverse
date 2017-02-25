"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ArrayObverse = ArrayObverse;

var _common = require("./common");

var Common = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var arrayPrototype = Array.prototype,
    slice = arrayPrototype.slice,
    pop = arrayPrototype.pop,
    push = arrayPrototype.push,
    unshift = arrayPrototype.unshift,
    shift = arrayPrototype.shift,
    splice = arrayPrototype.splice,
    methods = {
    ARRAY_POP: pop,
    ARRAY_PUSH: push,
    ARRAY_UNSHIFT: unshift,
    ARRAY_ShIFT: shift,
    ARRAY_SPLICE: splice
};


function _getArrayItem(arr, index) {
    return arr[index];
}

function ArrayObverse(arr, callback) {

    //  对会直接对数组进行修改的方法进行代理
    arr.pop = function () {
        var argus = [].concat(Array.prototype.slice.call(arguments)),
            old = Common.deepCopy(arr),
            length = old.length,
            changed = length >= 1 ? old[length - 1] : undefined;


        methods.ARRAY_POP.apply(arr, argus);

        callback("pop", changed, old, arr);
    };

    arr.push = function (items) {
        var argus = [].concat(Array.prototype.slice.call(arguments)),
            old = Common.deepCopy(arr);

        methods.ARRAY_PUSH.apply(arr, argus);
        callback("push", argus, old, arr);
        return arr.length;
    };

    arr.unshift = function () {
        var old = Common.deepCopy(arr),
            length = old.length,
            changed = length >= 1 ? old[length - 1] : undefined;


        methods.ARRAY_UNSHIFT.call(arr);
        callback("unshift", changed, old, arr);
    };

    arr.shift = function () {
        var old = Common.deepCopy(arr),
            length = old.length,
            changed = length >= 1 ? old[0] : undefined;


        methods.ARRAY_ShIFT.call(arr);
        callback("shift", changed, old, arr);
    };

    arr.splice = function () {
        var old = Common.deepCopy(arr),
            argus = [].concat(Array.prototype.slice.call(arguments)),
            length = argus.length;


        var changed = {
            removed: [],
            changeIndexStart: -1,
            changeIndexEnd: -1,
            replace: []
        };

        switch (length) {
            case 0:
                changed.changeIndexStart = argus[0];
                changed.changeIndexEnd = arr.length - 1;
                changed.removed = [];
                changed.replace = [];
                break;

            case 1:
                changed.changeIndexStart = argus[0];
                changed.changeIndexEnd = arr.length - 1;
                changed.removed = slice.apply(arr, argus);
                break;

            case 2:
                changed.changeIndexStart = argus[0];
                changed.changeIndexEnd = argus[1] + argus[0];
                changed.removed = slice.apply(arr, argus);
                break;

            default:
                changed.changeIndexStart = argus[0];
                changed.changeIndexEnd = argus[1] + argus[0];
                changed.removed = slice.apply(arr, [argus[0], argus[1]]);
                changed.replace = argus.slice(2);
                break;
        }

        methods.ARRAY_SPLICE.apply(arr, argus);
        callback("splice", changed, old, arr);
    };

    function buildProxy(array, callback) {
        return new Proxy(arr, {
            set: function set(target, index, value) {
                var old = target[index],
                    oldType = Common.typeOf(old),
                    newType = Common.typeOf(value);

                var type = undefined,
                    compareFn = void 0;

                if (oldType === newType && oldType !== "Undefined") {
                    compareFn = Common["compare" + oldType];
                    if (Common.typeOf(compareFn) === "Undefined") {
                        compareFn = Common.compareOther;
                    }
                    if (!compareFn(old, value)) {
                        type = "modify";
                    }
                } else if (oldType !== newType && oldType !== "Undefined" && newType !== "Undefined") {
                    type = "modify";
                } else if (oldType !== "Undefined" && newType === "Undefined") {
                    type = "remove";
                } else if (oldType === "Undefined" && newType !== "Undefined") {
                    type = "add";
                }

                target[index] = value;
                if (type !== undefined) {
                    callback(type, [value], old, value);
                }
            },
            get: function get(target, index) {
                var out = target[index];
                if (Array.isArray(out)) {
                    return buildProxy(out, callback);
                }
                return out;
            }
        });
    }

    return buildProxy(arr, callback);
}