'use strict';

const _ = require('lodash');
const Joi = require('joi');
const Parser = require('./parser');

/**
 * Dependency injection container
 *
 * For more usage examples see: {@link Dic#registerInstance}, {@link Dic#registerClass}, {@link Dic#registerFactory},
 * {@link Dic#registerAsyncFactory}, {@link Dic#bindChild}.
 *
 * @example // Dependency injection example
 * class MyService {
 *   constructor(myServiceOpts) {
 *     this.options = myServiceOpts;
 *   }
 * }
 *
 * const {Dic} = require('bb-dic');
 * const dic = new Dic();
 *
 * dic.registerInstance('myServiceOpts', { some: 'thing' });
 *
 * const myService = dic.get('myService');
 *
 */
class Dic {

  /**
   * @param {Object} options
   * @param {String} options.containerSeparator Container / service name separator. Default `_`. See {@link Dic#bindChild}
   * @param {boolean} options.debug Debug on/off
   */
  constructor(options) {
    this.options = Joi.attempt(options || {}, Joi.object().keys({
      containerSeparator: Joi.string().optional().default('_'),
      debug: Joi.boolean().optional().default(false)
    }).options({
      stripUnknown: true,
      presence: 'required'
    }));
    this.instances = {};
    this.loaders = [];
    this.parent = null;
    this.parentOptions = {};
    this.children = {};

    this.parser = new Parser();
  }

  log(msg) {
    if (this.options.debug) {
      console.log(`${this.getDicInstanceName()}: ${msg}`);
    }
  }

  registerLoader(loader, loadInstances = []) {
    this.loaders.push(loader);
  }

  /**
   * Registers async factory.
   *
   * Factory function is called asynchronously and should return an instance of the service.
   *
   * @alias Dic#asyncFactory

   * @example
   * dic.registerInstance('mongoConnectionOpts', { url: 'mongodb://localhost:27017/mydb' });
   * dic.registerAsyncFactory('mongoConnection', async function(mongoConnectionOpts) {
   *   return await MongoClient.connect(mongoConnectionOpts.url);
   * });
   *
   * @param name
   * @param factory
   */
  registerAsyncFactory(name, factory, opts) {
    opts = opts || {};
    this.log(`Adding async factory "${name}" Options: `, opts);//XXX

    if (!opts.params) {
      const ret = this.parser.parseFunction(factory);
      opts.params = ret.params;
    }

    this.register(name ,_.defaults({
      type: 'asyncFactory',
      asyncFactory: factory
    }, opts));
  }

  asyncFactory() {
    return this.registerAsyncFactory(...arguments);
  }

  /**
   * Register a factory.
   *
   * The factory function should return an instance of the service.
   *
   * @alias Dic#factory
   *
   * @example
   * dic.registerInstance('myServiceOpts', { some: 'thing' })
   * dic.registerFactory('myService', function(myServiceOpts) {
   *   return new MyService(myServiceOpts);
   * });
   *
   * @param name
   * @param factory
   */
  registerFactory(name, factory, opts = {}) {
    this.log(`Adding factory "${name}" Options: `, opts);//XXX

    this.register(name, _.defaults({
      factory: factory
    }, opts));
  }

  factory() {
    return this.registerFactory(...arguments);
  }

  /**
   * Register an instance
   *
   * @alias Dic#instance
   *
   * @example
   *
   * dic.registerInstance('myScalarValue', 'string');
   * dic.registerInstance('myObject', { some: 'thing' });
   * dic.registerInstance('myFunction', function(msg) { console.log(msg) });
   *
   * @param name
   * @param instance
   */
  registerInstance(name, ins, opts = {}) {
    this.log(`Adding instance "${name}" Options: `, opts);//XXX

    this.register(name, _.defaults({
      instance: ins
    }, opts));
  }

  instance() {
    return this.registerInstance(...arguments);
  }

  /**
   * Register a class
   *
   * @alias Dic#class
   *
   * @example // Class instance registration with dependency injection
   *
   * class MyService {
   *   constructor(myServiceOpts) {
   *     this.options = myServiceOpts;
   *   }
   * }
   *
   * dic.registerInstance('myServiceOpts', {
   *   some: 'options'
   * })
   * dic.registerClass('myService', MyService)
   *
   * @example // Class instance registration with default async init function
   *
   * class MyService {
   *   // optional async initialization of an instance
   *   async asyncInit() {
   *     //some async initialization e.g. open DB connection.
   *   }
   * }
   *
   * dic.registerClass('myService', MyService)
   *
   * @example // Custom async init function
   *
   * class MyService {
   *   async otherAsyncInitFn() {
   *     //...
   *   }
   * }
   *
   * dic.registerClass('myService', MyService, {
   *   asyncInit: 'otherAsyncInitFn'
   * })
   *
   * @param name
   * @param classDef
   * @param {Object} opts
   * @param {boolean|string} opts.asyncInit If true default asyncInit() function is used. If string, provided function is called on {@link Dic#asyncInit}.
   */
  registerClass(name, classDef, opts = {}) {
    this.log(`Adding class "${name}" Options: `, opts);//XXX

    this.register(name, _.defaults({
      class: classDef
    }, opts));
  }

  class() {
    return this.registerClass(...arguments);
  }

  register(name, def) {
    const ret = this.findContainer(name);

    if (ret.def) {
      this.throwError(`Service "${name}" already registered`);
    }

    ret.container.instances[ret.name] = this.validateDef(def);
  }

  /**
   * Runs async initialization of container services.
   *
   * This includes instances registered using:
   *
   *  - {@link Dic#registerAsyncFactory}
   *  - {@link Dic#registerClass} a class having `async asyncInit()` method or with async init option set
   *
   *  @example
   *  dic.asyncInit().then(() => {
   *    // your services should be fully instantiated.
   *  }, err => {
   *    // async initialization of some service thrown an error.
   *    console.error(err);
   *  });
   */
  async asyncInit() {
    this.log(`asyncInit started ...`);//XXX

    await Promise.all(_.map(this.children, child => {
      return child.asyncInit();
    }));

    for (const name in this.instances) {
      const def = this.instances[name];
      if (def.type === 'asyncFactory' || def.asyncInit) {
        await this.getAsync(name, {
          stack: []
        });
      }
    }

    this.log(`asyncInit finished.`);//XXX
  }

  /**
   * Returns true if a service is registered with a container
   *
   * @param name
   * @returns {boolean}
   */
  has(name) {
    const ret = this.findContainer(name);
    return ret && ret.def;
  }

  findContainer(name) {
    const separator = this.options.containerSeparator;
    const def = this.instances[name];
    if (def) {
      return {
        container: this,
        name: name,
        def: def
      }
    }

    if (name.indexOf(separator) !== -1) {
      const [childName, serviceName] = name.split(separator);
      const cont = this.children[childName];
      if (cont) {
        if (cont.instances[serviceName]) {
          return {
            container: cont,
            name: serviceName,
            def: cont.instances[serviceName]
          };
        }
        return {
          container: cont,
          name: serviceName
        }
      }
    }

    if (this.parent) {
      const parentName = this.parentOptions.name + separator + name;
      if (this.parent.instances[parentName]) {
        return {
          container: this.parent,
          name: parentName,
          def: this.parent.instances[parentName]
        };
      }
    }

    return {
      container: this,
      name: name
    };
  }

  getDicInstanceName() {
    if (this.parent) {
      return this.parent.getDicInstanceName() + '.' + this.parentOptions.name;
    }

    return 'Dic';
  }

  throwError(msg, stack) {
    let stackStr = '';
    if (stack) {
      stackStr = '[' + stack.join(' > ') + ']';
    }
    throw new Error(`${this.getDicInstanceName()}: ${msg} ${stackStr}`);
  }

  /**
   * Get an instance.
   *
   * Throws an error if instance needs to be async initialized and is not yet.
   *
   * @example
   * const myService = dic.get('myService');
   *
   * @param {String} name
   * @returns {*}
   */
  get(name, opts = {}) {
    opts = this._createOpts(name, opts);
    const def = this.instances[name];
    if (!def) {
      const loc = this.findContainer(name);
      if (!loc.def) {
        this.throwError(`Instance "${name}" not defined`, opts.stack);
      }
      return loc.container.get(loc.name);
    }

    if (def.type === 'asyncFactory' && !def.asyncInitialized) {
      this.throwError(`Async factory for ${name} must be run first. Run dic.asyncInit()`, opts.stack);
    }

    if (!opts.ignoreAsync && def.asyncInit && !def.asyncInitialized) {
      this.throwError(`Instance "${name}" is not async initialized yet`, opts.stack);
    }

    if (def.instance) {
      return def.instance;
    }

    const instance = this.createInstance(def, opts);

    //test for possible init method but without init enabled
    if (this.hasAsyncInit(instance)) {
      if (_.isUndefined(def.asyncInit)) {
        this.throwError(`${name} has got ${name}.asyncInit() method. Did you forget to mark this instance to be async initialized?`, opts.stack);
      } else if (!def.asyncInit) {
        console.warn(`${name} has got ${name}.asyncInit() method but auto init is disabled. Make sure you init the service manually yourself.`);
      }
    }

    def.instance = instance;
    return instance;
  }

  /**
   * Get an instance.
   *
   * Async initialize the instance if it's not yet.
   *
   * @example // Async/await
   * const myService = await dic.get('myService');
   *
   * @example // Promise
   * dic.getAsync('myService').then(myService => {
   *   // ...
   * });
   *
   * @param {String} name
   * @returns {*}
   */
  async getAsync(name, opts = {}) {
    opts = this._createOpts(name, opts);
    const def = this.instances[name];
    if (!def) {
      const loc = this.findContainer(name);
      if (!loc.def) {
        this.throwError(`Instance "${name}" not defined`, opts.stack);
      }
      return await loc.container.getAsync(loc.name, opts);
    }

    if (def.instance) {
      return def.instance;
    }

    const instance = await this.createInstanceAsync(def, opts);
    if (def.asyncInit) {
      this.log(`async ${name}`);//XXX

      //make sure all services are also async initialized if needed
      //for (const param of def.params) {
      //  await this.getAsync(param);
      //}

      let initMethod = 'asyncInit';
      if (_.isString(def.asyncInit)) {
        initMethod = def.asyncInit;
      }
      await instance[initMethod]();
    }

    def.instance = instance;
    def.asyncInitialized = true;
    return instance;
  }

  hasAsyncInit(instance) {
    return !!this.getAsyncInitDef(instance);
  }

  getAsyncInitDef(instance) {
    return instance.asyncInit ? 'asyncInit' : false;
  }

  /**
   * Creates an alias for existing container instance.
   *
   * @example
   * dic.registerInstance('one', 1);
   * dic.alias('one', 'oneAgain');
   *
   * dic.get('one') === dic.get('oneAgain')
   *
   * @param {String} name An instance to be aliased
   * @param {String} alias Alias
   */
  alias(name, alias) {
    if (!this.has(name)) {
      this.throwError(`Service "${name}" is not registered`);
    }
    if (this.has(alias)) {
      this.throwError(`Cannot use alias "${alias}". Service with this name is registered already.`);
    }
    const serviceLoc = this.findContainer(name);
    const destLoc = this.findContainer(alias);
    this.log(`aliasing "${alias}" -> "${name}"`);//XXX
    destLoc.container.instances[destLoc.name] = serviceLoc.container.instances[serviceLoc.name];
  }

  /**
   * Bind other Dic instance with this one.
   *
   * @example
   * // -----------------------------------------
   * // my-package.js - reusable package
   * // -----------------------------------------
   * const {Dic} = require('bb-dic');
   *
   * class Logger {
   *   log(msg) {
   *     console.log('MyLogger: ' + msg);
   *   }
   * }
   *
   * const dic = new Dic();
   * dic.registerInstance('logger', Logger);
   *
   * module.exports = dic;
   *
   * // -----------------------------------------
   * // my-application.js - an application itself
   * // -----------------------------------------
   * const {Dic} = require('bb-dic');
   * const packageDic = require('./my-package');
   *
   * class MyService() {
   *   constructor(myPackage_logger) {
   *     // injected logger instance
   *     this.logger = myPackage_logger;
   *   }
   *
   *   sayHello(msg) {
   *     this.logger.log(msg);
   *   }
   * }
   *
   * const dic = new Dic();
   * dic.registerClass('myService', MyService);
   *
   * dic.bindChild(packageDic, {
   *   name: 'myPackage'
   * })
   *
   * // get a child service instance directly
   * const logger = dic.get('myPackage_logger');
   *
   * @param {Dic} dic
   * @param {Object} opts
   * @param {String} opts.name Container services prefix name
   */
  bindChild(dic, opts = {}) {
    opts = Joi.attempt(opts, {
      name: Joi.string().required()
    });

    dic.parent = this;
    dic.parentOptions = opts;

    this.children[opts.name] = dic;
  }

  getChild(name) {
    if (!this.children[name]) {
      this.throwError(`${name} child container does not exist`);
    }

    return this.children[name];
  }

  /**
   * Create an instance injecting it's dependencies from the container
   *
   * @param {Object} def
   * @param {Object} opts
   * @returns {*}
   */
  createInstance(def, opts) {
    def = this.validateDef(def);

    switch(def.type) {
      case 'asyncFactory':
        this.throwError('Use dic.createInstanceAsync() instead', opts.stack);
        break;
      case 'factory':
        return def.factory(...(this.getServices(def.params, def.inject, opts)));
        break;
      case 'class':
        return new (def.class)(...(this.getServices(def.params, def.inject, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`, opts.stack);
    }
  }

  /**
   * Create an instance injecting it's dependencies from the container
   *
   * @param {Object} def
   * @param {Object} opts
   * @returns {*}
   */
  async createInstanceAsync(def, opts) {
    def = this.validateDef(def);

    switch(def.type) {
      case 'asyncFactory':
        return await def.asyncFactory(...(await this.getServicesAsync(def.params, def.inject, opts)));
        break;
      case 'factory':
        return def.factory(...(await this.getServicesAsync(def.params, def.inject, opts)));
        break;
      case 'class':
        return new (def.class)(...(await this.getServicesAsync(def.params, def.inject, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`, opts.stack);
    }
  }

  validateDef(def) {
    def = Joi.attempt(def, Joi.object().keys({
      type: Joi.string(),
      instance: Joi.any(),
      class: Joi.func(),
      factory: Joi.func(),
      asyncInit: Joi.any(),
      params: Joi.array(),
      asyncFactory: Joi.func(),
      inject: Joi.object().default({})
    }));

    if (!def.type) {
      for (const type of ['class', 'factory', 'asyncFactory', 'instance']) {
        if (def[type]) {
          def.type = type;
        }
      }
    }

    if (def.type === 'class') {
      if (_.isUndefined(def.asyncInit)) {
        const ret = this.parser.parseClass(def.class);
        if (ret.init) {
          def.asyncInit = ret.init.name;
        }
      }
    }

    if (!def.params) {
      switch(def.type) {
        case 'instance':
          break;
        case 'asyncFactory':
        case 'factory':
          const ret1 = this.parser.parseFunction(def.factory || def.asyncFactory);
          def.params = ret1.params;
          break;
        case 'class':
          const ret2 = this.parser.parseClass(def.class);
          if (ret2.factory.type !== 'ClassConstructor') {
            this.throwError('Could not find a constructor def');
          }
          def.params = ret2.factory.params;
          break;
        default:
          this.throwError(`Unknown instance def type: ${def.type}`);
      }
    }

    return def;
  }

  getServices(serviceNames, inject = {}, opts = {}) {
    if (!_.isArray(serviceNames)) {
      return [];
    }

    return serviceNames.map((param) => {
      if (inject[param]) {
        return inject[param];
      }
      return this.get(param, opts);
    });
  }

  getServicesAsync(serviceNames, inject = {}, opts = {}) {
    if (!_.isArray(serviceNames)) {
      return [];
    }

    const servicesPromises = serviceNames.map((param) => {
      if (inject[param]) {
        return inject[param];
      }
      return this.getAsync(param, opts);
    });

    return Promise.all(servicesPromises);
  }

  _createOpts(service, opts) {
    const instanceOpts = _.cloneDeep(opts);
    let stack = _.get(instanceOpts, 'stack');
    if (!stack) {
      stack = [service ? service : '$this'];
    } else {
      stack.push(service);
    }
    instanceOpts.stack = stack;
    return instanceOpts;
  }

}

module.exports = Dic;
