const _ = require('lodash');
const path = require('path');

module.exports = class DicRequireLoader {
  constructor(opts, dic) {
    this.options = opts;
    this.dic = dic;
  }

  getInstance(instance) {
    return this.dic.get(instance, {
      ignoreInit: true
    });
  }

  enable() {
    const self = this;
    //http://stackoverflow.com/questions/27948300/override-the-require-function
    var Module = require('module');
    DicRequireLoader.originalRequire = Module.prototype.require;

    Module.prototype.require = function() {
      const requestedModulePath = arguments[0];

      // node_modules module
      if (requestedModulePath[0] !== '.') {
        if (self.dic.has(requestedModulePath)) {
          console.log(`DicRequireLoader: Module "${moduleId}" instance loaded from Dic [${this.filename}]`);//XXX
          return self.getInstance(requestedModulePath);
        }

        console.log(`DicRequireLoader: Ignoring module "${requestedModulePath}" [${this.filename}]`);//XXX
        return DicRequireLoader.originalRequire.apply(this, arguments);
      }

      const currentDir = path.dirname(this.filename);
      const modulePath = path.resolve(currentDir + '/' + requestedModulePath);
      const moduleId = path.relative(self.options.rootDir, modulePath);

      if (self.options.exclude) {
        for (const exc of self.options.exclude) {
          //TODO this should be done much smarter - glob?
          if (moduleId.indexOf(exc) === 0) {
            console.log(`DicRequireLoader: Module "${moduleId}" excluded [${this.filename}]`);//XXX
            return DicRequireLoader.originalRequire.apply(this, arguments);
          }
        }
      }

      if (self.dic.has(moduleId)) {
        console.log(`DicRequireLoader: Module "${moduleId}" instance loaded from Dic [${this.filename}]`);//XXX
        return self.getInstance(moduleId);
      }

      const inc = DicRequireLoader.originalRequire.apply(this, arguments);

      const opts = {};

      //TODO auto-detect asyncInit - should test for generator
      if (_.isFunction(inc.asyncInit)) {
        opts.asyncInit = 'asyncInit';
      }

      self.dic.instance(moduleId, inc, opts);
      console.log(`DicRequireLoader: Module "${moduleId}" added to Dic [${this.filename}]`);//XXX
      return inc;
    };
  }

};
