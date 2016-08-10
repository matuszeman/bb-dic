const _ = require('lodash');

module.exports = class Dic {
  constructor() {
    this.parent = null;
    this.instances = {};
  }

  factory(name, factory, opts = {}) {
    console.log(`Dic: Adding factory "${name}"`);//XXX
    this.instances[name] = {
      type: 'factory',
      fn: factory,
      opts: opts
    };
  }

  instance(name, ins, opts = {}) {
    console.log(`Dic: Adding "${name}"`);//XXX

    this.instances[name] = {
      type: 'instance',
      instance: ins,
      opts: opts
    };
  }

  *asyncInit() {
    console.log('Dic: asyncInit started ...');//XXX
    for (const name in this.instances) {
      const def = this.instances[name];
      if (def.opts.asyncInit && !def.initialized) {
        console.log(`Dic: ${name} asyncInit`);//XXX
        const ins = this.get(name, {
          ignoreInit: true
        });
        let initMethod = 'asyncInit';
        if (_.isString(def.opts.asyncInit)) {
          initMethod = def.opts.asyncInit;
        }
        yield ins[initMethod]();
        def.initialized = true;
      }
    }
    console.log('Dic: asyncInit finished.');//XXX
  }

  has(name) {
    return !_.isUndefined(this.instances[name]);
  }

  get(name, opts = {}) {
    const def = this.instances[name];
    if (!def) {
      throw new Error(`Dic: Instance "${name}" not defined`);
    }

    if (!opts.ignoreInit && def.opts.asyncInit && !def.initialized) {
      throw new Error(`Dic: Instance "${name}" is not initialized yet`);
    }

    if (def.instance) {
      return def.instance;
    }

    const instance = this.createInstance(def);

    //test for possible init method but without init enabled
    if (instance.asyncInit) {
      if (_.isUndefined(def.opts.asyncInit)) {
        throw new Error(`${name} has got ${name}.init() method. Did you forget to mark this instance to be initialized?`);
      } else if (!def.opts.asyncInit) {
        console.warn(`${name} has got ${name}.init() method but auto init is disabled. Make sure you init the service manually yourself.`);
      }
    }

    def.instance = instance;
    return instance;
  }

  alias(name, alias) {
    if (!this.has(name)) {
      throw new Error(`Dic: don't have instance "${name}"`);
    }
    console.log(`Dic: aliasing "${alias}" -> "${name}"`);//XXX
    this.instances[alias] = this.instances[name];
  }

  createInstance(def) {
    switch(def.type) {
      case 'factory':
        return this.invoke(def.fn);
        break;
      default:
        throw new Error('Unknown instance def type');
    }
  }

  invoke(fn, ctx) {
    return fn.call(ctx, this);
  }
};
