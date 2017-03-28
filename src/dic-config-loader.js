const _ = require('lodash');

/**
 * Config loader - sets up Dic from the config (plain object)
 */
class DicConfigLoader {
  /**
   * @param {Object} opts
   * @param {string} opts.optionsSuffix What suffix to use for "options" config. See: {@link DicConfigLoader#loadConfig}
   */
  constructor(opts = {}) {
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
  loadConfig(dic, config) {
    _.each(config.options, (opts, service) => {
      dic.instance(service + this.options.optionsSuffix, opts);
    });

    _.each(config.aliases, (alias, service) => {
      dic.alias(alias, service);
    });

    _.each(config.bindings, (binding, containerName) => {
      const child = dic.getChild(containerName);

      this.loadConfig(child, binding);

      _.each(binding.imports, (dicService, childService) => {
        dic.alias(dicService, containerName + dic.options.containerSeparator + childService);
      });
    });
  }
}

module.exports = DicConfigLoader;
