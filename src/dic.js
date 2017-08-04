'use strict';

const _ = require('lodash');
const Joi = require('joi');
const Parser = require('./parser');

/**
 * Dependency injection container
 *
 * For more usage examples see: {@link Dic#instance}, {@link Dic#class}, {@link Dic#factory},
 * {@link Dic#asyncFactory}, {@link Dic#bind}.
 *
 * @example // Dependency injection example
 * class MyService {
 *   constructor(myServiceOpts) {
 *     this.options = myServiceOpts;
 *   }
 * }
 *
 * const {Dic} = require('@kapitchi/bb-dic');
 * const dic = new Dic();
 *
 * dic.instance('myServiceOpts', { some: 'thing' });
 *
 * const myService = dic.get('myService');
 *
 */
class Dic {

  /**
   * @param {Object} [options]
   * @param {String} [options.containerSeparator=_] Container / service name separator. See {@link Dic#bind}
   * @param {boolean} [options.debug=false] Debug on/off.
   * @param {number} [options.ecmaVersion=8] ECMAScript version.
   */
  constructor(options) {
    this.options = Joi.attempt(options || {}, Joi.object().keys({
      containerSeparator: Joi.string().optional().default('_'),
      debug: Joi.boolean().optional().default(false),
      ecmaVersion: Joi.number().optional().default(8)
    }).options({
      stripUnknown: true,
      presence: 'required'
    }));
    this.instances = {};
    this.parent = null;
    this.parentOptions = {};
    this.children = {};

    this.parser = new Parser({
      ecmaVersion: this.options.ecmaVersion
    });
  }

  log(msg) {
    if (this.options.debug) {
      console.log(`${this.getDicInstanceName()}: ${msg}`);
    }
  }

  /**
   * Registers async factory.
   *
   * Factory function is called asynchronously and should return an instance of the service.
   *
   * @alias Dic#asyncFactory

   * @example
   * dic.instance('mongoConnectionOpts', { url: 'mongodb://localhost:27017/mydb' });
   * dic.asyncFactory('mongoConnection', async function(mongoConnectionOpts) {
   *   return await MongoClient.connect(mongoConnectionOpts.url);
   * });
   *
   * @param {String} name
   * @param {Function} factory
   * @param {defOpts} [opts]
   */
  registerAsyncFactory(name, factory, opts = {}) {
    this.log(`Adding async factory "${name}" Options: `, opts);//XXX

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
   * dic.instance('myServiceOpts', { some: 'thing' })
   * dic.factory('myService', function(myServiceOpts) {
   *   return new MyService(myServiceOpts);
   * });
   *
   * @param name
   * @param factory
   * @param {defOpts} [opts]
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
   * dic.instance('myScalarValue', 'string');
   * dic.instance('myObject', { some: 'thing' });
   * dic.instance('myFunction', function(msg) { console.log(msg) });
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
   * dic.instance('myServiceOpts', {
   *   some: 'options'
   * })
   * dic.class('myService', MyService)
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
   * dic.class('myService', MyService)
   *
   * @example // Custom async init function
   *
   * class MyService {
   *   async otherAsyncInitFn() {
   *     //...
   *   }
   * }
   *
   * dic.class('myService', MyService, {
   *   asyncInit: 'otherAsyncInitFn'
   * })
   *
   * @param name
   * @param classDef
   * @param {defOpts} [opts]
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
    def.container = this;
    ret.container.instances[ret.name] = this.validateDef(def);
  }

  /**
   * Runs async initialization of container services.
   *
   * This includes instances registered using:
   *
   *  - {@link Dic#asyncFactory}
   *  - {@link Dic#class} a class having `async asyncInit()` method or with async init option set
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

    for (const childName in this.children) {
      const child = this.children[childName];
      await child.asyncInit();
    }

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

    //make sure that async service can be resolved once only and return same promise
    // => only first call resolves the service for DIC
    if(def.initPromise) {
      return def.initPromise;
    }

    return def.initPromise = this._getAsyncResolve(name, def, opts);
  }

  async _getAsyncResolve(name, def, opts) {
    const instance = await this.createInstanceAsync(def, opts);
    if (def.asyncInit) {
      let initMethod = 'asyncInit';
      if (_.isString(def.asyncInit)) {
        initMethod = def.asyncInit;
      }
      this.log(`Async init: ${name}.${initMethod}()`);
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
   * dic.instance('one', {some: 'instance'});
   * dic.alias('one', 'oneAgain');
   *
   * dic.get('one') === dic.get('oneAgain')
   *
   * @param {String} name An instance to be aliased
   * @param {String} alias Alias
   */
  alias(name, alias) {
    this.log(`aliasing "${alias}" -> "${name}"`);//XXX
    if (!this.has(name)) {
      this.throwError(`Service "${name}" is not registered`);
    }
    if (this.has(alias)) {
      this.throwError(`Cannot use alias "${alias}". Service with this name is registered already.`);
    }
    const serviceLoc = this.findContainer(name);
    const destLoc = this.findContainer(alias);
    destLoc.container.instances[destLoc.name] = serviceLoc.container.instances[serviceLoc.name];
  }

  /**
   * Bind other Dic instance with this one.
   *
   * @example
   * // -----------------------------------------
   * // my-package.js - reusable package
   * // -----------------------------------------
   * const {Dic} = require('@kapitchi/bb-dic');
   *
   * class Logger {
   *   log(msg) {
   *     console.log('MyLogger: ' + msg);
   *   }
   * }
   *
   * const dic = new Dic();
   * dic.instance('logger', Logger);
   *
   * module.exports = dic;
   *
   * // -----------------------------------------
   * // my-application.js - an application itself
   * // -----------------------------------------
   * const {Dic} = require('@kapitchi/bb-dic');
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
   * dic.class('myService', MyService);
   *
   * dic.bind(packageDic, {
   *   name: 'myPackage'
   * })
   *
   * // get a child service instance directly
   * const logger = dic.get('myPackage_logger');
   *
   * @alias Dic#bind
   *
   * @param {Dic} dic
   * @param {Object} opts
   * @param {String} opts.name Container services prefix name
   */
  bindContainer(dic, opts = {}) {
    opts = Joi.attempt(opts, {
      name: Joi.string().required()
    });

    dic.parent = this;
    dic.parentOptions = opts;

    this.children[opts.name] = dic;
  }

  bind(dic, opts = {}) {
    this.bindContainer(dic, opts);
  }

  getBoundContainer(name) {
    if (!this.children[name]) {
      this.throwError(`${name} child container does not exist`);
    }

    return this.children[name];
  }

  /**
   * Create an instance injecting it's dependencies from the container
   *
   * @example
   * class MyClass {
   *   constructor(myClassOpts, someService) {
   *   }
   * }
   *
   * dic.instance('myClassOpts', { my: 'options' });
   * dic.instance('someService', { real: 'service' });
   *
   * const ins = dic.createInstance({
   *   class: MyClass,
   *   inject: {
   *     // myClassOpts - injected from dic
   *     // someService - the below is injected instead of dic registered 'someService'.
   *     someService: { mock: 'service' }
   *   }
   * })
   *
   * @param {Object} def
   * @param {function} def.factory Factory function
   * @param {function} def.class Class constructor
   * @param {Object} def.inject
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
        return def.factory(...(this._getServices(def, opts)));
        break;
      case 'class':
        return new (def.class)(...(this._getServices(def, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`, opts.stack);
    }
  }

  /**
   * Create an instance (async) injecting it's dependencies from the container.
   *
   * See {@link Dic#createInstance}
   *
   * @param {Object} def
   * @param {function} def.asyncFactory Async function
   * @param {function} def.factory Factory function
   * @param {function} def.class Class constructor
   * @param {Object} def.inject
   * @param {Object} opts
   * @returns {*}
   */
  async createInstanceAsync(def, opts) {
    def = this.validateDef(def);

    switch(def.type) {
      case 'asyncFactory':
        return await def.asyncFactory(...(await this._getServicesAsync(def, opts)));
        break;
      case 'factory':
        return def.factory(...(await this._getServicesAsync(def, opts)));
        break;
      case 'class':
        return new (def.class)(...(await this._getServicesAsync(def, opts)));
        break;
      default:
        this.throwError(`Unknown instance def type: ${def.type}`, opts.stack);
    }
  }

  /**
   * @typedef {Object} defOpts
   * @property {string|boolean} [asyncInit] If true default asyncInit() function is used. If string, provided function is called on {@link Dic#asyncInit}.
   * @property {Object} [paramsAlias] Use to alias class constructor or factory parameters.
   * E.g. `{ serviceA: 'serviceB' }` injects `serviceB` instance instead of `serviceA` to the class constructor/factory.
   */
  validateDef(def) {
    def = Joi.attempt(def, Joi.object().keys({
      type: Joi.string(),
      instance: Joi.any(),
      class: Joi.func(),
      factory: Joi.func(),
      asyncInit: Joi.any(),
      params: Joi.array(),
      paramsAlias: Joi.object().default({}),
      asyncFactory: Joi.func(),
      inject: Joi.object().default({}),
      container: Joi.object().default(this) //type(Dic) - this does not work when having Dic from different packages obviously
    }).options({
      allowUnknown: true //e.g. asyncInitialized
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
      switch (def.type) {
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

  _getServices(def, opts = {}) {
    const {container} = def;
    const params = this._getDefParams(def);
    return params.map((param) => {
      if (def.inject[param]) {
        return def.inject[param];
      }
      return container.get(param, opts);
    });
  }

  async _getServicesAsync(def, opts = {}) {
    const {container} = def;
    const params = this._getDefParams(def);

    const ret = [];
    for (const param of params) {
      if (def.inject && def.inject[param]) {
        ret.push(def.inject[param]);
        continue;
      }
      ret.push(await container.getAsync(param, opts));
    }

    return ret;
  }

  _getDefParams(def) {
    return def.params.map((param) => {
      return _.get(def.paramsAlias, param, param);
    })
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
