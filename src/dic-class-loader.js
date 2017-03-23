const _ = require('lodash');
const nodePath = require('path');
const globby = require('globby');
const Dic = require('./dic');

/**
 * Class loader
 */
class DicClassLoader {
  /**
   * @param {Object|Dic} opts Options or Dic
   * @param {string} opts.rootDir
   * @param {Dic} dic
   */
  constructor(opts, dic) {
    if (opts instanceof Dic) {
      dic = opts;
      opts = {};
    }

    this.options = _.defaults(opts, {
      rootDir: process.cwd()
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
   * @example // Registers all classes under `CWD/src` folder.
   *
   * const {Dic, DicClassLoader} = require('bb-dic');
   * const dic = new Dic();
   * const loader = new DicClassLoader(dic);
   * loader.loadPath('src/*.js');
   *
   * module.exports = dic;
   *
   * @param {string} path glob expression {@link https://www.npmjs.com/package/globby}
   */
  loadPath(path) {
    const ret = globby.sync(path, {
      cwd: this.options.rootDir
    });
    for (const p of ret) {
      const mod = require(this.options.rootDir + '/' + p);
      const name = _.camelCase(nodePath.basename(p, '.js'));
      this.dic.registerClass(name, mod);
    }
  }
}

module.exports = DicClassLoader;
