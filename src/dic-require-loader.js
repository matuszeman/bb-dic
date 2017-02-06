const _ = require('lodash');
const path = require('path');
const isGeneratorFn = require('is-generator').fn;

module.exports = class DicRequireLoader {
  constructor(opts, dic) {
    this.options = _.defaults(opts, {
      modulePrefix: './'
    });
    this.dic = dic;
  }

  getInstance(instance) {
    return this.dic.get(instance, {
      ignoreInit: true
    });
  }

  enable() {
    if (DicRequireLoader.originalRequire) {
      throw new Error('DicRequireLoader already enabled');
    }

    const self = this;
    //http://stackoverflow.com/questions/27948300/override-the-require-function
    var Module = require('module');
    DicRequireLoader.originalRequire = Module.prototype.require;

    Module.prototype.require = function() {
      const requestedModulePath = arguments[0];

      // TODO system node_modules modules - this should be done more clever
      if (requestedModulePath[0] !== '.' ||                     //not relative path => system module
        this.filename.indexOf('/node_modules/') !== -1 ||       //requires from system modules (mocha)
        requestedModulePath.indexOf('/node_modules/') !== -1) { //app requires of system modules (mocha)
        if (self.dic.has(requestedModulePath)) {
          console.log(`DicRequireLoader: System module "${requestedModulePath}" loaded from Dic [${this.filename}]`);//XXX
          return self.getInstance(requestedModulePath);
        }

        //console.log(`DicRequireLoader: System module "${requestedModulePath}" ignored [${this.filename}]`);//XXX
        return DicRequireLoader.originalRequire.apply(this, arguments);
      }

      const currentDir = path.dirname(this.filename);
      const modulePath = path.resolve(currentDir + '/' + requestedModulePath);
      const relativeModulePath = path.relative(self.options.rootDir, modulePath);
      const moduleId = self.options.modulePrefix + relativeModulePath;

      if (self.dic.has(moduleId)) {
        //console.log(`DicRequireLoader: Module "${moduleId}" instance loaded from Dic [${this.filename}]`);//XXX
        return self.getInstance(moduleId);
      }

      let dicAllowed = true;
      if (self.options.include) {
        dicAllowed = false;
        for (const incPath of self.options.include) {
          //TODO this should be done much smarter - glob?
          if (relativeModulePath.indexOf(incPath) === 0) {
            dicAllowed = true;
            break;
          }
        }
      }

      if (self.options.exclude) {
        for (const excPath of self.options.exclude) {
          //TODO this should be done much smarter - glob?
          if (relativeModulePath.indexOf(excPath) === 0) {
            dicAllowed = false;
            break;
          }
        }
      }

      if (!dicAllowed) {
        //console.log(`DicRequireLoader: Module "${moduleId}" excluded [${this.filename}]`);//XXX
        return DicRequireLoader.originalRequire.apply(this, arguments);
      }

      //const instance = DicRequireLoader.originalRequire.apply(this, arguments);

      const opts = {
        loader: self,
        requireLoader: {
          modulePath: relativeModulePath
        }
      };

      self.dic.registerRequire(moduleId, requestedModulePath, opts);

      console.log(`DicRequireLoader: Module "${moduleId}" added to Dic [${this.filename}]`);//XXX
      return self.dic.get(moduleId);
    };
  }

  exportService(serviceDef) {
    return {
      type: 'require',
      path: serviceDef.requireLoader.modulePath
    }
  }

};
