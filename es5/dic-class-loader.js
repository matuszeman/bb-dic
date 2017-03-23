'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

    _classCallCheck(this, DicClassLoader);

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


  _createClass(DicClassLoader, [{
    key: 'loadPath',
    value: function loadPath(path) {
      var ret = globby.sync(path, {
        cwd: this.options.rootDir
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = ret[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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