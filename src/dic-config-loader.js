const _ = require('lodash');

class DicConfigLoader {
  constructor(opts, dic) {
    this.options = _.defaults(opts, {
      optionsSuffix: 'Opts'
    });
    this.dic = dic;
  }

  loadConfig(obj) {
    _.each(obj.options, (opts, service) => {
      this.dic.registerInstance(service + this.options.optionsSuffix, opts);
    });

    _.each(obj.aliases, (alias, service) => {
      this.dic.alias(alias, service);
    });

    _.each(obj.bindings, (binding, containerName) => {
      const child = this.dic.getChild(containerName);

      const loader = new DicConfigLoader(this.options, child);
      loader.loadConfig(binding);

      _.each(binding.imports, (dicService, childService) => {
        this.dic.alias(dicService, containerName + this.dic.options.containerSeparator + childService);
      });
    });
  }
}

module.exports = DicConfigLoader;
