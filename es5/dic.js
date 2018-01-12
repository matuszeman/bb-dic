'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var Joi = require('joi');
var Parser = require('./parser');

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

var Dic = function () {

  /**
   * @param {Object} [options]
   * @param {String} [options.containerSeparator=_] Container / service name separator. See {@link Dic#bind}
   * @param {boolean} [options.debug=false] Debug on/off.
   * @param {number} [options.ecmaVersion=8] ECMAScript version.
   */
  function Dic(options) {
    (0, _classCallCheck3.default)(this, Dic);

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

  (0, _createClass3.default)(Dic, [{
    key: 'log',
    value: function log(msg) {
      if (this.options.debug) {
        console.log(this.getDicInstanceName() + ': ' + msg);
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

  }, {
    key: 'registerAsyncFactory',
    value: function registerAsyncFactory(name, factory) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      this.log('Adding async factory "' + name + '" Options: ', opts); //XXX

      this.register(name, _.defaults({
        type: 'asyncFactory',
        asyncFactory: factory
      }, opts));
    }
  }, {
    key: 'asyncFactory',
    value: function asyncFactory() {
      return this.registerAsyncFactory.apply(this, arguments);
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

  }, {
    key: 'registerFactory',
    value: function registerFactory(name, factory) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      this.log('Adding factory "' + name + '" Options: ', opts); //XXX

      this.register(name, _.defaults({
        factory: factory
      }, opts));
    }
  }, {
    key: 'factory',
    value: function factory() {
      return this.registerFactory.apply(this, arguments);
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

  }, {
    key: 'registerInstance',
    value: function registerInstance(name, ins) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      this.log('Adding instance "' + name + '" Options: ', opts); //XXX

      this.register(name, _.defaults({
        instance: ins
      }, opts));
    }
  }, {
    key: 'instance',
    value: function instance() {
      return this.registerInstance.apply(this, arguments);
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

  }, {
    key: 'registerClass',
    value: function registerClass(name, classDef) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      this.log('Adding class "' + name + '" Options: ', opts); //XXX

      this.register(name, _.defaults({
        class: classDef
      }, opts));
    }
  }, {
    key: 'class',
    value: function _class() {
      return this.registerClass.apply(this, arguments);
    }
  }, {
    key: 'register',
    value: function register(name, def) {
      var ret = this.findContainer(name);

      if (ret.def) {
        this.throwError('Service "' + name + '" already registered');
      }
      def.name = name;
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

  }, {
    key: 'asyncInit',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var childName, child, name, def;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.log('asyncInit started ...'); //XXX

                _context.t0 = _regenerator2.default.keys(this.children);

              case 2:
                if ((_context.t1 = _context.t0()).done) {
                  _context.next = 9;
                  break;
                }

                childName = _context.t1.value;
                child = this.children[childName];
                _context.next = 7;
                return child.asyncInit();

              case 7:
                _context.next = 2;
                break;

              case 9:
                _context.t2 = _regenerator2.default.keys(this.instances);

              case 10:
                if ((_context.t3 = _context.t2()).done) {
                  _context.next = 18;
                  break;
                }

                name = _context.t3.value;
                def = this.instances[name];

                if (!(def.type === 'asyncFactory' || def.asyncInit)) {
                  _context.next = 16;
                  break;
                }

                _context.next = 16;
                return this.getAsync(name, {
                  stack: []
                });

              case 16:
                _context.next = 10;
                break;

              case 18:

                this.log('asyncInit finished.'); //XXX

              case 19:
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
            _name$split2 = (0, _slicedToArray3.default)(_name$split, 2),
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
    value: function throwError(msg, stack) {
      var stackStr = '';
      if (stack) {
        stackStr = '[' + stack.join(' > ') + ']';
      }
      throw new Error(this.getDicInstanceName() + ': ' + msg + ' ' + stackStr);
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

      opts = this._createOpts(name, opts);
      var def = this.instances[name];
      if (!def) {
        var loc = this.findContainer(name);
        if (!loc.def) {
          this.throwError('Instance "' + name + '" not defined', opts.stack);
        }
        return loc.container.get(loc.name);
      }

      if (def.type === 'asyncFactory' && !def.asyncInitialized) {
        this.throwError('Async factory for ' + name + ' must be run first. Run dic.asyncInit()', opts.stack);
      }

      if (!opts.ignoreAsync && def.asyncInit && !def.asyncInitialized) {
        this.throwError('Instance "' + name + '" is not async initialized yet', opts.stack);
      }

      if (def.instance) {
        return def.instance;
      }

      var instance = this.createInstance(def, opts);

      //test for possible init method but without init enabled
      if (this.hasAsyncInit(instance)) {
        if (_.isUndefined(def.asyncInit)) {
          this.throwError(name + ' has got ' + name + '.asyncInit() method. Did you forget to mark this instance to be async initialized?', opts.stack);
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
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var def, loc;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                opts = this._createOpts(name, opts);
                def = this.instances[name];

                if (def) {
                  _context2.next = 8;
                  break;
                }

                loc = this.findContainer(name);

                if (!loc.def) {
                  this.throwError('Instance "' + name + '" not defined', opts.stack);
                }
                _context2.next = 7;
                return loc.container.getAsync(loc.name, opts);

              case 7:
                return _context2.abrupt('return', _context2.sent);

              case 8:
                if (!def.instance) {
                  _context2.next = 10;
                  break;
                }

                return _context2.abrupt('return', def.instance);

              case 10:
                if (!def.initPromise) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt('return', def.initPromise);

              case 12:
                return _context2.abrupt('return', def.initPromise = this._getAsyncResolve(name, def, opts));

              case 13:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getAsync(_x6) {
        return _ref2.apply(this, arguments);
      }

      return getAsync;
    }()
  }, {
    key: '_getAsyncResolve',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(name, def, opts) {
        var instance, initMethod;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.createInstanceAsync(def, opts);

              case 2:
                instance = _context3.sent;

                if (!def.asyncInit) {
                  _context3.next = 9;
                  break;
                }

                initMethod = 'asyncInit';

                if (_.isString(def.asyncInit)) {
                  initMethod = def.asyncInit;
                }
                this.log('Async init: ' + name + '.' + initMethod + '()');
                _context3.next = 9;
                return instance[initMethod]();

              case 9:

                def.instance = instance;
                def.asyncInitialized = true;
                return _context3.abrupt('return', instance);

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _getAsyncResolve(_x8, _x9, _x10) {
        return _ref3.apply(this, arguments);
      }

      return _getAsyncResolve;
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
     * dic.instance('one', {some: 'instance'});
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
      this.log('aliasing "' + _alias + '" -> "' + name + '"'); //XXX
      if (!this.has(name)) {
        this.throwError('Service "' + name + '" is not registered');
      }
      if (this.has(_alias)) {
        this.throwError('Cannot use alias "' + _alias + '". Service with this name is registered already.');
      }
      var serviceLoc = this.findContainer(name);
      var destLoc = this.findContainer(_alias);
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

  }, {
    key: 'bindContainer',
    value: function bindContainer(dic) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      opts = Joi.attempt(opts, {
        name: Joi.string().required()
      });

      dic.parent = this;
      dic.parentOptions = opts;

      this.children[opts.name] = dic;
    }
  }, {
    key: 'bind',
    value: function bind(dic) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this.bindContainer(dic, opts);
    }
  }, {
    key: 'getBoundContainer',
    value: function getBoundContainer(name) {
      if (!this.children[name]) {
        this.throwError(name + ' child container does not exist');
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

  }, {
    key: 'createInstance',
    value: function createInstance(def, opts) {
      var _def;

      def = this.validateDef(def);

      var ins = void 0;
      switch (def.type) {
        case 'asyncFactory':
          this.throwError('Use dic.createInstanceAsync() instead', opts.stack);
          break;
        case 'factory':
          ins = (_def = def).factory.apply(_def, (0, _toConsumableArray3.default)(this._getServices(def, opts)));
          break;
        case 'class':
          ins = new (Function.prototype.bind.apply(def.class, [null].concat((0, _toConsumableArray3.default)(this._getServices(def, opts)))))();
          break;
        default:
          this.throwError('Unknown instance def type: ' + def.type, opts.stack);
      }

      return this.instanceCreated(ins, def);
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

  }, {
    key: 'createInstanceAsync',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(def, opts) {
        var _def2, _def3;

        var ins;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                def = this.validateDef(def);

                ins = void 0;
                _context4.t0 = def.type;
                _context4.next = _context4.t0 === 'asyncFactory' ? 5 : _context4.t0 === 'factory' ? 16 : _context4.t0 === 'class' ? 25 : 37;
                break;

              case 5:
                _context4.t1 = (_def2 = def).asyncFactory;
                _context4.t2 = _def2;
                _context4.t3 = _toConsumableArray3.default;
                _context4.next = 10;
                return this._getServicesAsync(def, opts);

              case 10:
                _context4.t4 = _context4.sent;
                _context4.t5 = (0, _context4.t3)(_context4.t4);
                _context4.next = 14;
                return _context4.t1.apply.call(_context4.t1, _context4.t2, _context4.t5);

              case 14:
                ins = _context4.sent;
                return _context4.abrupt('break', 38);

              case 16:
                _context4.t6 = (_def3 = def).factory;
                _context4.t7 = _def3;
                _context4.t8 = _toConsumableArray3.default;
                _context4.next = 21;
                return this._getServicesAsync(def, opts);

              case 21:
                _context4.t9 = _context4.sent;
                _context4.t10 = (0, _context4.t8)(_context4.t9);
                ins = _context4.t6.apply.call(_context4.t6, _context4.t7, _context4.t10);
                return _context4.abrupt('break', 38);

              case 25:
                _context4.t11 = Function.prototype.bind;
                _context4.t12 = def.class;
                _context4.t13 = [null];
                _context4.t14 = _toConsumableArray3.default;
                _context4.next = 31;
                return this._getServicesAsync(def, opts);

              case 31:
                _context4.t15 = _context4.sent;
                _context4.t16 = (0, _context4.t14)(_context4.t15);
                _context4.t17 = _context4.t13.concat.call(_context4.t13, _context4.t16);
                _context4.t18 = _context4.t11.apply.call(_context4.t11, _context4.t12, _context4.t17);
                ins = new _context4.t18();
                return _context4.abrupt('break', 38);

              case 37:
                this.throwError('Unknown instance def type: ' + def.type, opts.stack);

              case 38:
                return _context4.abrupt('return', this.instanceCreated(ins, def));

              case 39:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function createInstanceAsync(_x13, _x14) {
        return _ref4.apply(this, arguments);
      }

      return createInstanceAsync;
    }()
  }, {
    key: 'instanceCreated',
    value: function instanceCreated(ins, def) {
      if (this.factoryListener) {
        return this.factoryListener(ins, def);
      }

      return ins;
    }

    /**
     * @typedef {Object} defOpts
     * @property {string|boolean} [asyncInit] If true default asyncInit() function is used. If string, provided function is called on {@link Dic#asyncInit}.
     * @property {Object} [paramsAlias] Use to alias class constructor or factory parameters.
     * E.g. `{ serviceA: 'serviceB' }` injects `serviceB` instance instead of `serviceA` to the class constructor/factory.
     */

  }, {
    key: 'validateDef',
    value: function validateDef(def) {
      def = Joi.attempt(def, Joi.object().keys({
        name: Joi.string(),
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
        var _arr = ['class', 'factory', 'asyncFactory', 'instance'];

        for (var _i = 0; _i < _arr.length; _i++) {
          var type = _arr[_i];
          if (def[type]) {
            def.type = type;
          }
        }
      }

      if (def.type === 'class') {
        if (_.isUndefined(def.asyncInit)) {
          var ret = this.parser.parseClass(def.class);
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
            var ret1 = this.parser.parseFunction(def.factory || def.asyncFactory);
            def.params = ret1.params;
            break;
          case 'class':
            var ret2 = this.parser.parseClass(def.class);
            if (ret2.factory.type !== 'ClassConstructor') {
              this.throwError('Could not find a constructor def');
            }
            def.params = ret2.factory.params;
            break;
          default:
            this.throwError('Unknown instance def type: ' + def.type);
        }
      }

      return def;
    }
  }, {
    key: '_getServices',
    value: function _getServices(def) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var container = def.container;

      var params = this._getDefParams(def);
      return params.map(function (param) {
        if (def.inject[param]) {
          return def.inject[param];
        }
        return container.get(param, opts);
      });
    }
  }, {
    key: '_getServicesAsync',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(def) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var container, params, ret, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, param;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                container = def.container;
                params = this._getDefParams(def);
                ret = [];
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context5.prev = 6;
                _iterator = (0, _getIterator3.default)(params);

              case 8:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context5.next = 21;
                  break;
                }

                param = _step.value;

                if (!(def.inject && def.inject[param])) {
                  _context5.next = 13;
                  break;
                }

                ret.push(def.inject[param]);
                return _context5.abrupt('continue', 18);

              case 13:
                _context5.t0 = ret;
                _context5.next = 16;
                return container.getAsync(param, opts);

              case 16:
                _context5.t1 = _context5.sent;

                _context5.t0.push.call(_context5.t0, _context5.t1);

              case 18:
                _iteratorNormalCompletion = true;
                _context5.next = 8;
                break;

              case 21:
                _context5.next = 27;
                break;

              case 23:
                _context5.prev = 23;
                _context5.t2 = _context5['catch'](6);
                _didIteratorError = true;
                _iteratorError = _context5.t2;

              case 27:
                _context5.prev = 27;
                _context5.prev = 28;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 30:
                _context5.prev = 30;

                if (!_didIteratorError) {
                  _context5.next = 33;
                  break;
                }

                throw _iteratorError;

              case 33:
                return _context5.finish(30);

              case 34:
                return _context5.finish(27);

              case 35:
                return _context5.abrupt('return', ret);

              case 36:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[6, 23, 27, 35], [28,, 30, 34]]);
      }));

      function _getServicesAsync(_x16) {
        return _ref5.apply(this, arguments);
      }

      return _getServicesAsync;
    }()
  }, {
    key: '_getDefParams',
    value: function _getDefParams(def) {
      return def.params.map(function (param) {
        return _.get(def.paramsAlias, param, param);
      });
    }
  }, {
    key: '_createOpts',
    value: function _createOpts(service, opts) {
      var instanceOpts = _.cloneDeep(opts);
      var stack = _.get(instanceOpts, 'stack');
      if (!stack) {
        stack = [service ? service : '$this'];
      } else {
        stack.push(service);
      }
      instanceOpts.stack = stack;
      return instanceOpts;
    }
  }]);
  return Dic;
}();

module.exports = Dic;
//# sourceMappingURL=dic.js.map