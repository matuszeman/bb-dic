'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

/**
 * Dic loader
 *
 * @example // Registers all classes/factories/instances under `__dirname/src` folder.
 *
 * const {Dic, DicLoader} = require('@kapitchi/bb-dic');
 * const dic = new Dic();
 *
 * const loader = new DicLoader({
 *   rootDir: __dirname + '/src' //if not specified process.cwd() is used by default
 * });
 * loader.loadPath(dic, '*.js');
 *
 * module.exports = dic;
 */

var DicLoader = function () {
  /**
   * @param {Object} opts
   * @param {string} opts.rootDir Absolute path to root folder of source files. Default: `process.cwd()`
   */
  function DicLoader() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, DicLoader);

    this.options = _.defaults(opts, {
      rootDir: process.cwd(),
      debug: false
    });
  }

  /**
   * Load all instances/factories/classes to {@link Dic}.
   *
   * File types and what they should export
   * - name.js -> class
   * - name.factory.js -> factory
   * - name.async-factory.js -> async factory
   * - name.instance.js -> instance
   *
   *
   * File name dictates what name the service will be registered as.
   * E.g. `my-service.js` service would become registered as `myService` => file name is camelCased.
   *
   * @param {Dic} dic
   * @param {string} path glob expression {@link https://www.npmjs.com/package/globby}
   * @param {Object} [opts]
   * @param {string} [opts.prefix=''] Instance name prefix
   * @param {string} [opts.rootDir] Overwrites loader's rootDir option
   */


  (0, _createClass3.default)(DicLoader, [{
    key: 'loadPath',
    value: function loadPath(dic, path) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _.defaults(opts, {
        prefix: ''
      });

      var rootDir = opts.rootDir ? opts.rootDir : this.options.rootDir;

      var ret = globby.sync(path, {
        cwd: rootDir
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(ret), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var relPath = _step.value;

          var absPath = rootDir + '/' + relPath;
          var mod = require(absPath);

          //es6 modules default export
          if (_.isObject(mod) && mod.__esModule && mod.default) {
            mod = mod.default;
          }

          var basename = nodePath.basename(relPath, '.js');

          var type = 'class';
          var name = _.camelCase(basename);

          var match = basename.match(/(.*)\.(factory|async-factory|instance)$/);
          if (match) {
            name = _.camelCase(match[1]);
            type = match[2];
          }

          var pathParts = relPath.split('/');
          var prefixParts = opts.prefix ? [opts.prefix] : [];
          if (pathParts.length > 1) {
            //get rid of file name
            pathParts.pop();
            prefixParts.push.apply(prefixParts, (0, _toConsumableArray3.default)(pathParts));
          }

          var prefix = _.map(prefixParts, function (val, index) {
            val = _.camelCase(val);
            if (index > 0) {
              val = _.upperFirst(val);
            }
            return val;
          }).join('');

          if (!_.isEmpty(prefix)) {
            name = prefix + _.upperFirst(name);
          }

          if (this.options.debug) {
            console.log('DicLoader: ' + name + ' [' + type + '] -> ' + absPath);
          }

          switch (type) {
            case 'class':
              dic.class(name, mod);
              break;
            case 'async-factory':
              dic.asyncFactory(name, mod);
              break;
            case 'factory':
              dic.factory(name, mod);
              break;
            case 'instance':
              dic.instance(name, mod);
              break;
            default:
              throw new Error('Type ' + type + ' not supported');
          }
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
  return DicLoader;
}();

module.exports = DicLoader;
//# sourceMappingURL=dic-loader.js.map