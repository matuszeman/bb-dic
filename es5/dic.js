'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var Joi = require('joi');
var Parser = require('./parser');

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

var Dic = function () {

  /**
   * @param {Object} options
   * @param {String} options.containerSeparator Container / service name separator. Default `_`. See {@link Dic#bindChild}
   * @param {boolean} options.debug Debug on/off
   */
  function Dic(options) {
    _classCallCheck(this, Dic);

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

  _createClass(Dic, [{
    key: 'log',
    value: function log(msg) {
      if (this.options.debug) {
        console.log(this.getDicInstanceName() + ': ' + msg);
      }
    }
  }, {
    key: 'registerLoader',
    value: function registerLoader(loader) {
      var loadInstances = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

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

  }, {
    key: 'registerAsyncFactory',
    value: function registerAsyncFactory(name, factory, opts) {
      opts = opts || {};
      this.log('Adding async factory "' + name + '" Options: ', opts); //XXX

      if (!opts.params) {
        var ret = this.parser.parseFunction(factory);
        opts.params = ret.params;
      }

      this.register(name, _.defaults({
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

  }, {
    key: 'registerFactory',
    value: function registerFactory(name, factory, opts) {
      opts = opts || {};
      this.log('Adding factory "' + name + '" Options: ', opts); //XXX

      if (!opts.params) {
        var ret = this.parser.parseFunction(factory);
        opts.params = ret.params;
      }

      this.register(name, _.defaults({
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

  }, {
    key: 'registerInstance',
    value: function registerInstance(name, ins, opts) {
      opts = opts || {};
      this.log('Adding instance "' + name + '" Options: ', opts); //XXX

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

  }, {
    key: 'registerClass',
    value: function registerClass(name, classDef, opts) {
      opts = opts || {};
      this.log('Adding class "' + name + '" Options: ', opts); //XXX

      if (!opts.params) {
        var ret = this.parser.parseClass(classDef);
        if (ret.factory.type !== 'ClassConstructor') {
          this.throwError('Could not find a constructor def');
        }
        opts.params = ret.factory.params;
      }

      if (_.isUndefined(opts.asyncInit)) {
        var _ret = this.parser.parseClass(classDef);
        if (_ret.init) {
          opts.asyncInit = _ret.init.name;
        }
      }

      this.register(name, _.defaults({
        type: 'class',
        class: classDef
      }, opts));
    }
  }, {
    key: 'register',
    value: function register(name, def) {
      var ret = this.findContainer(name);

      if (ret.def) {
        this.throwError('Service "' + name + '" already registered');
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

  }, {
    key: 'asyncInit',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var name;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.log('asyncInit started ...'); //XXX

                _context.next = 3;
                return Promise.all(_.map(this.children, function (child) {
                  return child.asyncInit();
                }));

              case 3:
                _context.t0 = regeneratorRuntime.keys(this.instances);

              case 4:
                if ((_context.t1 = _context.t0()).done) {
                  _context.next = 10;
                  break;
                }

                name = _context.t1.value;
                _context.next = 8;
                return this.getAsync(name);

              case 8:
                _context.next = 4;
                break;

              case 10:

                this.log('asyncInit finished.'); //XXX

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function asyncInit() {
        return _ref.apply(this, arguments);
      }

      return asyncInit;
    }()

    /**
     * Returns true if a service is registered with a container
     *
     * @param name
     * @returns {boolean}
     */

  }, {
    key: 'has',
    value: function has(name) {
      var ret = this.findContainer(name);
      return ret && ret.def;
    }
  }, {
    key: 'findContainer',
    value: function findContainer(name) {
      var separator = this.options.containerSeparator;
      var def = this.instances[name];
      if (def) {
        return {
          container: this,
          name: name,
          def: def
        };
      }

      if (name.indexOf(separator) !== -1) {
        var _name$split = name.split(separator),
            _name$split2 = _slicedToArray(_name$split, 2),
            childName = _name$split2[0],
            serviceName = _name$split2[1];

        var cont = this.children[childName];
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
          };
        }
      }

      if (this.parent) {
        var parentName = this.parentOptions.name + separator + name;
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
  }, {
    key: 'getDicInstanceName',
    value: function getDicInstanceName() {
      if (this.parent) {
        return this.parent.getDicInstanceName() + '.' + this.parentOptions.name;
      }

      return 'Dic';
    }
  }, {
    key: 'throwError',
    value: function throwError(msg) {
      throw new Error(this.getDicInstanceName() + ': ' + msg);
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

  }, {
    key: 'get',
    value: function get(name) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var def = this.instances[name];
      if (!def) {
        var loc = this.findContainer(name);
        if (!loc.def) {
          this.throwError('Instance "' + name + '" not defined');
        }
        return loc.container.get(loc.name);
      }

      if (def.type === 'asyncFactory' && !def.initialized) {
        this.throwError('Async factory for ' + name + ' must be run first. Run dic.asyncInit()');
      }

      if (!opts.ignoreAsync && def.asyncInit && !def.initialized) {
        this.throwError('Instance "' + name + '" is not initialized yet');
      }

      if (def.instance) {
        return def.instance;
      }

      var instance = this.createInstance(def, opts);

      //test for possible init method but without init enabled
      if (this.hasAsyncInit(instance)) {
        if (_.isUndefined(def.asyncInit)) {
          this.throwError(name + ' has got ' + name + '.asyncInit() method. Did you forget to mark this instance to be initialized?');
        } else if (!def.asyncInit) {
          console.warn(name + ' has got ' + name + '.asyncInit() method but auto init is disabled. Make sure you init the service manually yourself.');
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

  }, {
    key: 'getAsync',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(name) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var def, loc, services, ins, instance, initMethod;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                def = this.instances[name];

                if (def) {
                  _context2.next = 7;
                  break;
                }

                loc = this.findContainer(name);

                if (!loc.def) {
                  this.throwError('Instance "' + name + '" not defined');
                }
                _context2.next = 6;
                return loc.container.getAsync(loc.name);

              case 6:
                return _context2.abrupt('return', _context2.sent);

              case 7:
                if (!def.instance) {
                  _context2.next = 9;
                  break;
                }

                return _context2.abrupt('return', def.instance);

              case 9:
                if (!(def.type === 'asyncFactory')) {
                  _context2.next = 18;
                  break;
                }

                this.log('async ' + name + ' factory'); //XXX

                //make sure all services are also async initialized if needed
                //for (const param of def.params) {
                //  await this.getAsync(param);
                //}

                _context2.next = 13;
                return this.getServicesAsync(def.params);

              case 13:
                services = _context2.sent;
                ins = def.factory.apply(def, _toConsumableArray(services));

                def.instance = ins;
                def.initialized = true;
                return _context2.abrupt('return', ins);

              case 18:
                _context2.next = 20;
                return this.createInstanceAsync(def);

              case 20:
                instance = _context2.sent;

                if (!def.asyncInit) {
                  _context2.next = 28;
                  break;
                }

                this.log('async ' + name); //XXX

                //make sure all services are also async initialized if needed
                //for (const param of def.params) {
                //  await this.getAsync(param);
                //}

                initMethod = 'asyncInit';

                if (_.isString(def.asyncInit)) {
                  initMethod = def.asyncInit;
                }
                _context2.next = 27;
                return instance[initMethod]();

              case 27:
                def.initialized = true;

              case 28:

                def.instance = instance;
                return _context2.abrupt('return', instance);

              case 30:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getAsync(_x3) {
        return _ref2.apply(this, arguments);
      }

      return getAsync;
    }()
  }, {
    key: 'hasAsyncInit',
    value: function hasAsyncInit(instance) {
      return !!this.getAsyncInitDef(instance);
    }
  }, {
    key: 'getAsyncInitDef',
    value: function getAsyncInitDef(instance) {
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

  }, {
    key: 'alias',
    value: function alias(name, _alias) {
      if (!this.has(name)) {
        this.throwError('Service "' + name + '" is not registered');
      }
      if (this.has(_alias)) {
        this.throwError('Cannot use alias "' + _alias + '". Service with this name is registered already.');
      }
      var serviceLoc = this.findContainer(name);
      var destLoc = this.findContainer(_alias);
      this.log('aliasing "' + _alias + '" -> "' + name + '"'); //XXX
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

  }, {
    key: 'bindChild',
    value: function bindChild(dic) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      opts = Joi.attempt(opts, {
        name: Joi.string().required()
      });

      dic.parent = this;
      dic.parentOptions = opts;

      this.children[opts.name] = dic;
    }
  }, {
    key: 'getChild',
    value: function getChild(name) {
      if (!this.children[name]) {
        this.throwError(name + ' child container does not exist');
      }

      return this.children[name];
    }
  }, {
    key: 'createInstance',
    value: function createInstance(def, opts) {
      switch (def.type) {
        case 'factory':
          return def.factory.apply(def, _toConsumableArray(this.getServices(def.params, opts)));
          break;
        case 'class':
          return new (Function.prototype.bind.apply(def.class, [null].concat(_toConsumableArray(this.getServices(def.params, opts)))))();
          break;
        default:
          this.throwError('Unknown instance def type: ' + def.type);
      }
    }
  }, {
    key: 'createInstanceAsync',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(def, opts) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.t0 = def.type;
                _context3.next = _context3.t0 === 'factory' ? 3 : _context3.t0 === 'class' ? 12 : 24;
                break;

              case 3:
                _context3.t1 = def.factory;
                _context3.t2 = def;
                _context3.t3 = _toConsumableArray;
                _context3.next = 8;
                return this.getServicesAsync(def.params, opts);

              case 8:
                _context3.t4 = _context3.sent;
                _context3.t5 = (0, _context3.t3)(_context3.t4);
                return _context3.abrupt('return', _context3.t1.apply.call(_context3.t1, _context3.t2, _context3.t5));

              case 12:
                _context3.t6 = Function.prototype.bind;
                _context3.t7 = def.class;
                _context3.t8 = [null];
                _context3.t9 = _toConsumableArray;
                _context3.next = 18;
                return this.getServicesAsync(def.params, opts);

              case 18:
                _context3.t10 = _context3.sent;
                _context3.t11 = (0, _context3.t9)(_context3.t10);
                _context3.t12 = _context3.t8.concat.call(_context3.t8, _context3.t11);
                _context3.t13 = _context3.t6.apply.call(_context3.t6, _context3.t7, _context3.t12);
                return _context3.abrupt('return', new _context3.t13());

              case 24:
                this.throwError('Unknown instance def type: ' + def.type);

              case 25:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createInstanceAsync(_x6, _x7) {
        return _ref3.apply(this, arguments);
      }

      return createInstanceAsync;
    }()
  }, {
    key: 'getServices',
    value: function getServices(serviceNames, opts) {
      var _this = this;

      if (!_.isArray(serviceNames)) {
        return [];
      }

      return serviceNames.map(function (serviceName) {
        return _this.get(serviceName, opts);
      });
    }
  }, {
    key: 'getServicesAsync',
    value: function getServicesAsync(serviceNames, opts) {
      var _this2 = this;

      if (!_.isArray(serviceNames)) {
        return [];
      }

      return Promise.all(serviceNames.map(function (serviceName) {
        return _this2.getAsync(serviceName, opts);
      }));
    }
  }]);

  return Dic;
}();

module.exports = Dic;