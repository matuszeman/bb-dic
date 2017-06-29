'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var acorn = require('acorn');
var loose = require('acorn/dist/acorn_loose');
//const walk = require('acorn/dist/walk');

require('acorn-es7-plugin')(acorn);

var Parser = function () {
  function Parser(options) {
    (0, _classCallCheck3.default)(this, Parser);

    this.options = {
      asyncInitMethodNames: ['asyncInit']
    };
  }

  (0, _createClass3.default)(Parser, [{
    key: 'parseClass',
    value: function parseClass(target) {
      if (!_.isString(target)) {
        target = target.toString();
      }

      try {
        //const node = loose.parse_dammit(target, {
        var node = acorn.parse(target, {
          //sourceType: 'script',
          plugins: {
            asyncawait: true
          },
          ecmaVersion: 7
        });
        return this.parseNode(node);
      } catch (e) {
        console.log('Failed to parse the class'); //XXX
        console.log(target); //XXX
        console.log(e); //XXX
        throw e;
      }
    }
  }, {
    key: 'parseFunction',
    value: function parseFunction(fn) {
      var fnString = fn.toString();
      // First match everything inside the function argument parens.
      var matches = fnString.match(/function\s.*?\(([^)]*)\)/);
      if (matches === null) {
        //try arrow function (arg1, ...) =>
        matches = fnString.match(/\(([^)]*)\)\s*=>/);
      }
      if (!matches) {
        throw new Error('Function with invalid format, only "function()" and "() =>" allowed');
      }
      var args = matches[1];

      // Split the arguments string into an array comma delimited.
      var params = args.split(',').map(function (arg) {
        // Ensure no inline comments are parsed and trim the whitespace.
        return arg.replace(/\/\*.*\*\//, '').trim();
      }).filter(function (arg) {
        // Ensure no undefined values are added.
        return arg;
      });

      return {
        params: params
      };
    }
  }, {
    key: 'isAsyncInitMethodName',
    value: function isAsyncInitMethodName(name) {
      return _.includes(this.options.asyncInitMethodNames, name);
    }
  }, {
    key: 'parseNode',
    value: function parseNode(node) {
      switch (node.type) {
        case 'Program':
          return this.parseNode(node.body[0]);
          break;
        case 'ClassDeclaration':
          return this.parseNode(node.body);
          break;
        case 'ClassBody':
          var ret = {
            factory: {
              type: 'ClassConstructor',
              params: []
            }
          };
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = (0, _getIterator3.default)(node.body), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var methodNode = _step.value;

              if (methodNode.type === 'MethodDefinition') {
                if (methodNode.kind === 'constructor') {
                  ret.factory = {
                    type: 'ClassConstructor',
                    params: this.getFunctionParams(methodNode.value)
                  };
                }

                if (methodNode.kind === 'method') {
                  if (this.isAsyncInitMethodName(methodNode.key.name)) {
                    //TODO promises, etc etc?
                    var type = 'sync';
                    if (methodNode.value.generator) {
                      type = 'generator';
                      // It looks like the plugin above strips "methodNode.value.async" async property at the end causing
                      // jsdoc2md to fail: "Unable to parse .../bb-dic/src/parser.js: Unexpected token )"
                      // https://www.npmjs.com/package/jsdoc-strip-async-await
                      //} else if (methodNode.value.async) {
                    } else if (methodNode.value['async']) {
                      type = 'async';
                    }

                    ret.init = {
                      name: methodNode.key.name,
                      type: type
                    };
                  }
                }
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

          return ret;
          break;
        case 'FunctionDeclaration':
          var ret1 = {};
          ret1.factory = {
            type: 'ClassConstructor',
            params: this.getFunctionParams(node)
          };
          return ret1;
        default:
          console.log(node); //XXX
          throw new Error('Parser for type ' + node.type + ' not implemented');
      }
    }
  }, {
    key: 'getFunctionParams',
    value: function getFunctionParams(node) {
      if (!node.params) {
        throw new Error('Node has got no params');
      }

      return node.params.map(function (paramNode) {
        return paramNode.name;
      });
    }
  }]);
  return Parser;
}();

module.exports = Parser;
//# sourceMappingURL=parser.js.map