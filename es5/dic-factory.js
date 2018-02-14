'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var Dic = require('./dic');
var DicConfigLoader = require('./dic-config-loader');
var DicLoader = require('./dic-loader');
/**
 * A factory
 */

var DicFactory = function () {
  function DicFactory() {
    (0, _classCallCheck3.default)(this, DicFactory);
  }

  (0, _createClass3.default)(DicFactory, null, [{
    key: 'createDic',

    /**
     * Creates DIC instance, uses loader and config loader
     *
     * @param {Object} params
     * @param {bool} [params.debug=false]
     * @param {string} [params.loaderRootDir] {@link DicLoader#constructor} If specified, `params.loaderPaths` must be specified too.
     * @param {string|string[]} [params.loaderPath] {@link DicLoader#loadPath}
     * @param {Object} [params.config] {@link DicConfigLoader#loadConfig}
     * @returns {{dic: Dic}}
     */
    value: function createDic(params) {
      params = _.defaults(params, {
        debug: false
      });

      var dic = new Dic({
        debug: params.debug
      });

      if (params.loaderRootDir) {
        if (!params.loaderPath) {
          throw new Error('params.loaderPath must be defined');
        }
        var loader = new DicLoader({
          rootDir: params.loaderRootDir,
          debug: params.debug
        });
        loader.loadPath(dic, params.loaderPath);
      }

      if (params.config) {
        var configLoader = new DicConfigLoader({
          debug: params.debug
        });
        configLoader.loadConfig(dic, params.config);
      }

      return {
        dic: dic
      };
    }
  }, {
    key: 'createCallbackPromise',
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
    key: 'createEmitterPromise',
    value: function createEmitterPromise(emitter, resolveEvent, rejectEvent) {
      var resolve = void 0,
          reject = void 0,
          resolveListener = void 0,
          rejectListener = void 0;

      var ready = new _promise2.default(function (res, rej) {
        resolve = res;
        reject = rej;
      });

      resolveListener = function resolveListener() {
        if (rejectEvent) {
          emitter.removeListener(rejectEvent, rejectListener);
        }
        resolve(emitter);
      };

      emitter.once(resolveEvent, resolveListener);

      if (rejectEvent) {
        rejectListener = function rejectListener(err) {
          emitter.removeListener(resolveEvent, resolveListener);
          reject(err);
        };
        emitter.once(rejectEvent, rejectListener);
      }

      return ready;
    }
  }]);
  return DicFactory;
}();

module.exports = DicFactory;
//# sourceMappingURL=dic-factory.js.map