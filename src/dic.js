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
      factory: factory
    }, opts));
  }

  /**
   * Register a factory.
   *
   * The factory function should return an instance of the service.
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
  registerFactory(name, factory, opts) {
    opts = opts || {};
    this.log(`Adding factory "${name}" Options: `, opts);//XXX

    if (!opts.params) {
      const ret = this.parser.parseFunction(factory);
      opts.params = ret.params;
    }

    this.register(name ,_.defaults({
      type: 'factory',
      factory: factory
    }, opts));
  }

  /**
   * Register an instance
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
  registerInstance(name, ins, opts) {
    opts = opts || {};
    this.log(`Adding instance "${name}" Options: `, opts);//XXX

    this.register(name, _.defaults({
      type: 'instance',
      instance: ins
    }, opts));
  }

  /**
   * Register a class
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
  registerClass(name, classDef, opts) {
    opts = opts || {};
    this.log(`Adding class "${name}" Options: `, opts);//XXX

    if (!opts.params) {
      const ret = this.parser.parseClass(classDef);
      if (ret.factory.type !== 'ClassConstructor') {
        this.throwError('Could not find a constructor def');
      }
      opts.params = ret.factory.params;
    }

    if (_.isUndefined(opts.asyncInit)) {
      const ret = this.parser.parseClass(classDef);
      if (ret.init) {
        opts.asyncInit = ret.init.name;
      }
    }

    this.register(name, _.defaults({
      type: 'class',
      class: classDef
    }, opts));
  }

  register(name, def) {
    const ret = this.findContainer(name);

    if (ret.def) {
      this.throwError(`Service "${name}" already registered`);
    }

    ret.container.instances[ret.name] = def;
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
      await this.getAsync(name);
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

  throwError(msg) {
    throw new Error(`${this.getDicInstanceName()}: ${msg}`);
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
    const def = this.instances[name];
    if (!def) {
      const loc = this.findContainer(name);
      if (!loc.def) {
        this.throwError(`Instance "${name}" not defined`);
      }
      return loc.container.get(loc.name);
    }

    if (def.type === 'asyncFactory' && !def.initialized) {
      this.throwError(`Async factory for ${name} must be run first. Run dic.asyncInit()`);
    }

    if (!opts.ignoreAsync && def.asyncInit && !def.initialized) {
      this.throwError(`Instance "${name}" is not initialized yet`);
    }

    if (def.instance) {
      return def.instance;
    }

    const instance = this.createInstance(def, opts);

    //test for possible init method but without init enabled
    if (this.hasAsyncInit(instance)) {
      if (_.isUndefined(def.asyncInit)) {
        this.throwError(`${name} has got ${name}.asyncInit() method. Did you forget to mark this instance to be initialized?`);
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
    const def = this.instances[name];
    if (!def) {
      const loc = this.findContainer(name);
      if (!loc.def) {
        this.throwError(`Instance "${name}" not defined`);
      }
      return await loc.container.getAsync(loc.name);
    }

    if (def.instance) {
      return def.instance;
    }

    if (def.type === 'asyncFactory') {
      this.log(`async ${name} factory`);//XXX

      //make sure all services are also async initialized if needed
      //for (const param of def.params) {
      //  await this.getAsync(param);
      //}

      const services = await this.getServicesAsync(def.params);
      const ins = def.factory(...services);
      def.instance = ins;
      def.initialized = true;
      return ins;
    }

    const instance = await this.createInstanceAsync(def);
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
      def.initialized = true;
    }

    def.instance = instance;
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

  createInstance(def, opts) {
    switch(def.type) {
      case 'factory':
        return def.factory(...(this.getServices(def.params, opts)));
        break;
      case 'class':
        return new (def.class)(...(this.getServices(def.params, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`);
    }
  }

  async createInstanceAsync(def, opts) {
    switch(def.type) {
      case 'factory':
        return def.factory(...(await this.getServicesAsync(def.params, opts)));
        break;
      case 'class':
        return new (def.class)(...(await this.getServicesAsync(def.params, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`);
    }
  }

  getServices(serviceNames, opts) {
    if (!_.isArray(serviceNames)) {
      return [];
    }

    return serviceNames.map(serviceName => this.get(serviceName, opts));
  }

  getServicesAsync(serviceNames, opts) {
    if (!_.isArray(serviceNames)) {
      return [];
    }

    return Promise.all(serviceNames.map(serviceName => this.getAsync(serviceName, opts)));
  }

}

module.exports = Dic;
