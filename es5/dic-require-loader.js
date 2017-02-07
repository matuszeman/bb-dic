'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var path = require('path');
var isGeneratorFn = require('is-generator').fn;

module.exports = function () {
  function DicRequireLoader(opts, dic) {
    _classCallCheck(this, DicRequireLoader);

    this.options = _.defaults(opts, {
      modulePrefix: './'
    });
    this.dic = dic;
  }

  _createClass(DicRequireLoader, [{
    key: 'getInstance',
    value: function getInstance(instance) {
      return this.dic.get(instance, {
        ignoreInit: true
      });
    }
  }, {
    key: 'enable',
    value: function enable() {
      if (DicRequireLoader.originalRequire) {
        throw new Error('DicRequireLoader already enabled');
      }

      var self = this;
      //http://stackoverflow.com/questions/27948300/override-the-require-function
      var Module = require('module');
      DicRequireLoader.originalRequire = Module.prototype.require;

      Module.prototype.require = function () {
        var requestedModulePath = arguments[0];

        // TODO system node_modules modules - this should be done more clever
        if (requestedModulePath[0] !== '.' || //not relative path => system module
        this.filename.indexOf('/node_modules/') !== -1 || //requires from system modules (mocha)
        requestedModulePath.indexOf('/node_modules/') !== -1) {
          //app requires of system modules (mocha)
          if (self.dic.has(requestedModulePath)) {
            console.log('DicRequireLoader: System module "' + requestedModulePath + '" loaded from Dic [' + this.filename + ']'); //XXX
            return self.getInstance(requestedModulePath);
          }

          //console.log(`DicRequireLoader: System module "${requestedModulePath}" ignored [${this.filename}]`);//XXX
          return DicRequireLoader.originalRequire.apply(this, arguments);
        }

        var currentDir = path.dirname(this.filename);
        var modulePath = path.resolve(currentDir + '/' + requestedModulePath);
        var relativeModulePath = path.relative(self.options.rootDir, modulePath);
        var moduleId = self.options.modulePrefix + relativeModulePath;

        if (self.dic.has(moduleId)) {
          //console.log(`DicRequireLoader: Module "${moduleId}" instance loaded from Dic [${this.filename}]`);//XXX
          return self.getInstance(moduleId);
        }

        var dicAllowed = true;
        if (self.options.include) {
          dicAllowed = false;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = self.options.include[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var incPath = _step.value;

              //TODO this should be done much smarter - glob?
              if (relativeModulePath.indexOf(incPath) === 0) {
                dicAllowed = true;
                break;
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

        if (self.options.exclude) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = self.options.exclude[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var excPath = _step2.value;

              //TODO this should be done much smarter - glob?
              if (relativeModulePath.indexOf(excPath) === 0) {
                dicAllowed = false;
                break;
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }

        if (!dicAllowed) {
          //console.log(`DicRequireLoader: Module "${moduleId}" excluded [${this.filename}]`);//XXX
          return DicRequireLoader.originalRequire.apply(this, arguments);
        }

        //const instance = DicRequireLoader.originalRequire.apply(this, arguments);

        var opts = {
          loader: self,
          requireLoader: {
            modulePath: relativeModulePath
          }
        };

        self.dic.registerRequire(moduleId, requestedModulePath, opts);

        console.log('DicRequireLoader: Module "' + moduleId + '" added to Dic [' + this.filename + ']'); //XXX
        return self.dic.get(moduleId);
      };
    }
  }, {
    key: 'exportService',
    value: function exportService(serviceDef) {
      return {
        type: 'require',
        path: serviceDef.requireLoader.modulePath
      };
    }
  }]);

  return DicRequireLoader;
}();