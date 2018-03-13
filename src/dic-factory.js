const _ = require('lodash');
const Dic = require('./dic');
const DicConfigLoader = require('./dic-config-loader');
const DicLoader = require('./dic-loader');
/**
 * A factory
 */
class DicFactory {
  /**
   * Creates DIC instance, uses loader and config loader
   *
   * @param {Object} params
   * @param {bool} [params.debug=false]
   * @param {string} [params.loaderRootDir] {@link DicLoader#constructor} If specified, `params.loaderPath` must be specified too.
   * @param {string|string[]} [params.loaderPath] {@link DicLoader#loadPath}
   * @param {Object} [params.config] {@link DicConfigLoader#loadConfig}
   * @returns {{dic: Dic}}
   */
  static createDic(params) {
    params = _.defaults(params, {
      debug: false
    });

    const dic = new Dic({
      debug: params.debug
    });

    if (params.loaderRootDir) {
      if (!params.loaderPath) {
        throw new Error('params.loaderPath must be defined');
      }
      const loader = new DicLoader({
        rootDir: params.loaderRootDir,
        debug: params.debug
      });
      loader.loadPath(dic, params.loaderPath);
    }

    if (params.config) {
      const configLoader = new DicConfigLoader({
        debug: params.debug
      });
      configLoader.loadConfig(dic, params.config);
    }

    return {
      dic
    }
  }

  static createCallbackPromise(fn) {
    let resolve, reject;
    const ready = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
    fn(err => err ? reject(err) : resolve());
    return ready;
  }

  static createEmitterPromise(emitter, resolveEvent, rejectEvent) {
    let resolve, reject, resolveListener, rejectListener;

    const ready = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

    resolveListener = () => {
      if (rejectEvent) {
        emitter.removeListener(rejectEvent, rejectListener);
      }
      resolve(emitter);
    };

    emitter.once(resolveEvent, resolveListener);

    if (rejectEvent) {
      rejectListener = (err) => {
        emitter.removeListener(resolveEvent, resolveListener);
        reject(err);
      };
      emitter.once(rejectEvent, rejectListener);
    }

    return ready;
  }
}

module.exports = DicFactory;
