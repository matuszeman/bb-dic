'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');

/**
 * Config loader - sets up Dic from the config (plain object)
 */

var DicConfigLoader = function () {
  /**
   * @param {Object} opts
   * @param {string} opts.optionsSuffix What suffix to use for "options" config. See: {@link DicConfigLoader#loadConfig}
   */
  function DicConfigLoader() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, DicConfigLoader);

    this.options = _.defaults(opts, {
      optionsSuffix: 'Opts'
    });
  }

  /**
   * Set up Dic according the config
   *
   * @example
   * {
   *   options: {
   *     service1: { } // {} is registered as "service1Opts" instance
   *   },
   *   aliases: {
   *     service2: 'service1' // "service1" is aliased to "service2"
   *   },
   *   bindings: {
   *     package1: { // bind container name
   *       imports: {
   *         serviceA: 'service1' // "service1" from main container is imported into "package1" container as "serviceA"
   *       },
   *       //options for bind container, same as for main container i.e. `options`, `aliases`, ...
   *     }
   *   }
   * }
   *
   * @param {Dic} dic
   * @param {Object} config
   * @param {Object} [config.options] Create plain object "option" instances
   * @param {Object} [config.aliases] Create aliases
   * @param {Object} [config.bindings] Set up bind Dic
   */


  (0, _createClass3.default)(DicConfigLoader, [{
    key: 'loadConfig',
    value: function loadConfig(dic, config) {
      var _this = this;

      _.each(config.options, function (opts, service) {
        dic.instance(service + _this.options.optionsSuffix, opts);
      });

      _.each(config.aliases, function (alias, service) {
        dic.alias(alias, service);
      });

      _.each(config.bindings, function (binding, containerName) {
        var child = dic.getChild(containerName);

        _this.loadConfig(child, binding);

        _.each(binding.imports, function (dicService, childService) {
          dic.alias(dicService, containerName + dic.options.containerSeparator + childService);
        });
      });
    }
  }]);
  return DicConfigLoader;
}();

module.exports = DicConfigLoader;