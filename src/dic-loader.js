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
   * `opts.removeDuplicate` option
   * If false, `user/user-service.js` would normally be aliased as `userUserService`.
   * If true, this would be work like examples below:
   * - `user/user-service.js` -> `userService`
   * - `user-service/user-service.js` -> `userService`
   * - `user-service/user-repository.js` -> `userServiceUserRepository`
   * - `users/user-service.js` -> `usersUserService`
   *
   * @param {Dic} dic
   * @param {string|string[]} path glob expression {@link https://www.npmjs.com/package/globby}
   * @param {Object} [opts]
   * @param {string} [opts.prefix=''] Instance name prefix
   * @param {string} [opts.postfix=''] Instance name postfix
   * @param {string} [opts.removeDuplicate=false] If true, remove duplicated folder/file names as described above.
   * @param {string} [opts.rootDir] Overwrites loader's rootDir option
   */
  loadPath(dic, path, opts = {}) {
    _.defaults(opts, {
      prefix: '',
      postfix: '',
      removeDuplicate: false
    });

    const rootDir = opts.rootDir ? opts.rootDir : this.options.rootDir;

    const ret = globby.sync(path, {
      cwd: rootDir
    });
    for (const relPath of ret) {
      const absPath = rootDir + '/' + relPath;
      let mod = require(absPath);

      //es6 modules default export
      if (_.isObject(mod) && mod.__esModule && mod.default) {
        mod = mod.default;
      }

      const basename = nodePath.basename(relPath, '.js');

      let type = 'class';
      let name =  basename;

      const typeMatch = basename.match(/(.*)\.(factory|async-factory|instance)$/);
      if (typeMatch) {
        name = typeMatch[1];
        type = typeMatch[2];
      }

      let pathParts = relPath.split(nodePath.posix.sep);
      pathParts.pop();
      pathParts.push(name);

      if (opts.removeDuplicate) {
        let spacedPath = pathParts.join(' ');
        spacedPath = spacedPath.replace(/\b([\w\-]+)\s+\1\b/g, '$1');
        pathParts = spacedPath.split(' ');
      }

      if (opts.prefix) {
        pathParts.unshift(opts.prefix);
      }

      if (opts.postfix) {
        pathParts.push(opts.postfix);
      }

      name = _.camelCase(pathParts.join('-'));
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
