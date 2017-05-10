'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var nodePath = require('path');
var globby = require('globby');
var Dic = require('./dic');

/**
 * Class loader
 */

var DicClassLoader = function () {
  /**
   * @param {Dic} dic
   * @param {Object} opts
   * @param {string} opts.rootDir Absolute path to root folder of source files. Default: `process.cwd()`
   */
  function DicClassLoader(dic) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, DicClassLoader);

    this.options = _.defaults(opts, {
      rootDir: process.cwd()
    });
    this.dic = dic;
  }

  /**
   * Load all files and register exported classes to {@link Dic}.
   *
   * All files are expected to export a class.
   *
   * File name dictates what name the service will be registered as.
   * E.g. `my-service.js` service would become registered as `myService` => file name is camelCased.
   *
   * @example // Registers all classes under `CWD/src` folder.
   *
   * const {Dic, DicClassLoader} = require('bb-dic');
   * const dic = new Dic();
   * const loader = new DicClassLoader(dic);
   * loader.loadPath('src/*.js');
   *
   * module.exports = dic;
   *
   * @param {string} path glob expression {@link https://www.npmjs.com/package/globby}
   */


  (0, _createClass3.default)(DicClassLoader, [{
    key: 'loadPath',
    value: function loadPath(path) {
      var ret = globby.sync(path, {
        cwd: this.options.rootDir
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(ret), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;

          var mod = require(this.options.rootDir + '/' + p);
          var name = _.camelCase(nodePath.basename(p, '.js'));
          this.dic.registerClass(name, mod);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);
  return DicClassLoader;
}();

module.exports = DicClassLoader;