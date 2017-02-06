const _ = require('lodash');
const nodePath = require('path');
const glob = require('glob');

/**
 * Class loader
 */
class DicClassLoader {
  /**
   * @param {Object} opts
   * @param {string} opts.rootDir
   * @param {Dic} dic
   */
  constructor(opts, dic) {
    this.options = _.defaults(opts, {
      rootDir: './'
    });
    this.dic = dic;
  }

  /**
   * Load all files and register exported classes to {@link Dic}.
   *
   * All files are expected to export a class.
   *
   * File name dictates what name the service will be registered as.
   * E.g. `my-service.js` service would become registered as `myService` => file name is camelCased.
   *
   * @example // Registers all classes under `__dirname/src` folder.
   *
   * const {Dic, DicClassLoader} = require('bb-dic');
   * const dic = new Dic();
   * const loader = new DicClassLoader({
   *   rootDir: __dirname
   * }, dic);
   * loader.loadPath('src/*.js');
   *
   * module.exports = dic;
   *
   * @param {string} path glob expression {@link https://www.npmjs.com/package/glob}
   */
  loadPath(path) {
    const filePaths = nodePath.resolve(this.options.rootDir, path);
    const ret = glob.sync(filePaths);
    for (const p of ret) {
      const mod = require(p);
      const name = _.camelCase(nodePath.basename(p, '.js'));
      this.dic.registerClass(name, mod);
    }
  }
}

module.exports = DicClassLoader;
