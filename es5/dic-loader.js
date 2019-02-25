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
   * `opts.removeDuplicate` option
   * If false, `user/user-service.js` would normally be aliased as `userUserService`.
   * If true, this would be work like examples below:
   * - `user/user-service.js` -> `userService`
   * - `user-service/user-service.js` -> `userService`
   * - `user-service/user-repository.js` -> `userServiceUserRepository`
   * - `users/user-service.js` -> `usersUserService`
   *
   * @param {Dic} dic
   * @param {string|string[]} path glob expression {@link https://www.npmjs.com/package/globby}
   * @param {Object} [opts]
   * @param {string} [opts.prefix=''] Instance name prefix
   * @param {string} [opts.postfix=''] Instance name postfix
   * @param {string} [opts.removeDuplicate=false] If true, remove duplicated folder/file names as described above.
   * @param {string} [opts.rootDir] Overwrites loader's rootDir option
   */


  (0, _createClass3.default)(DicLoader, [{
    key: 'loadPath',
    value: function loadPath(dic, path) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _.defaults(opts, {
        prefix: '',
        postfix: '',
        removeDuplicate: false
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
          var name = basename;

          var typeMatch = basename.match(/(.*)\.(factory|async-factory|instance)$/);
          if (typeMatch) {
            name = typeMatch[1];
            type = typeMatch[2];
          }

          var pathParts = relPath.split(nodePath.posix.sep);
          pathParts.pop();
          pathParts.push(name);

          if (opts.removeDuplicate) {
            var spacedPath = pathParts.join(' ');
            spacedPath = spacedPath.replace(/\b([\w\-]+)\s+\1\b/g, '$1');
            pathParts = spacedPath.split(' ');
          }

          if (opts.prefix) {
            pathParts.unshift(opts.prefix);
          }

          if (opts.postfix) {
            pathParts.push(opts.postfix);
          }

          name = _.camelCase(pathParts.join('-'));
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
