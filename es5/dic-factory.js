"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
  function DicFactory() {
    _classCallCheck(this, DicFactory);
  }

  _createClass(DicFactory, null, [{
    key: "createCallbackPromise",
    value: function createCallbackPromise(fn) {
      var resolve = void 0,
          reject = void 0;
      var ready = new Promise(function (res, rej) {
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
      var ready = new Promise(function (res, rej) {
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