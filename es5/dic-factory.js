"use strict";

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  function DicFactory() {
    (0, _classCallCheck3.default)(this, DicFactory);
  }

  (0, _createClass3.default)(DicFactory, null, [{
    key: "createCallbackPromise",
    value: function createCallbackPromise(fn) {
      var resolve = void 0,
          reject = void 0;
      var ready = new _promise2.default(function (res, rej) {
        resolve = res;
        reject = rej;
      });
      fn(function (err) {
        return err ? reject(err) : resolve();
      });
      return ready;
    }
  }, {
    key: "createEmitterPromise",
    value: function createEmitterPromise(emitter, resolveEvent, rejectEvent) {
      var resolve = void 0,
          reject = void 0;
      var ready = new _promise2.default(function (res, rej) {
        resolve = res;
        reject = rej;
      });

      emitter.once(resolveEvent, function () {
        resolve(emitter);
      });

      if (rejectEvent) {
        emitter.once(rejectEvent, function (err) {
          reject(err);
        });
      }

      return ready;
    }
  }]);
  return DicFactory;
}();
//# sourceMappingURL=dic-factory.js.map