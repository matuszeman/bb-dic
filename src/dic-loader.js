const _ = require('lodash');
const nodePath = require('path');
const globby = require('globby');

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
class DicLoader {
  /**
   * @param {Object} opts
   * @param {string} opts.rootDir Absolute path to root folder of source files. Default: `process.cwd()`
   */
  constructor(opts = {}) {
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
   */
  loadPath(dic, path, opts = {}) {
    _.defaults(opts, {
      prefix: ''
    });

    const ret = globby.sync(path, {
      cwd: this.options.rootDir
    });
    for (const relPath of ret) {
      const absPath = this.options.rootDir + '/' + relPath;
      let mod = require(absPath);

      //es6 modules default export
      if (_.isObject(mod) && mod.__esModule && mod.default) {
        mod = mod.default;
      }

      const basename = nodePath.basename(relPath, '.js');

      let type = 'class';
      let name =  _.camelCase(basename);

      const match = basename.match(/(.*)\.(factory|async-factory|instance)$/);
      if (match) {
        name = _.camelCase(match[1]);
        type = match[2];
      }

      const pathParts = relPath.split('/');
      const prefixParts = opts.prefix ? [opts.prefix] : [];
      if (pathParts.length > 1) {
        //get rid of file name
        pathParts.pop();
        prefixParts.push(...pathParts);
      }

      const prefix = _.map(prefixParts, (val, index) => {
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
        console.log(`DicLoader: ${name} [${type}] -> ${absPath}`);
      }

      switch(type) {
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
          throw new Error(`Type ${type} not supported`);
      }
    }
  }
}

module.exports = DicLoader;
