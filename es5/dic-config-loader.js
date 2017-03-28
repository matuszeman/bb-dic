'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

    _classCallCheck(this, DicConfigLoader);

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


  _createClass(DicConfigLoader, [{
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