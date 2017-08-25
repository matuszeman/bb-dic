const {expect} = require('chai');
const _ = require('lodash');
const {Dic} = require('../src');

describe('Example [alpha functionality]: Dic factory listener', () => {
  it('logger', () => {
    class Service {
      setLogger(logger) {
        this.logger = logger;
      }

      test() {
        this.logger.log('Logger test: OK!');
      }
    }

    class Logger {
      log(msg) {
        console.log(msg);//XXX
      }
    }
    const logger = new Logger();

    const dic = new Dic();
    dic.factoryListener = function(instance) {
      if (_.isFunction(instance.setLogger)) {
        instance.setLogger(logger);
      }
      return instance;
    };

    dic.class('service', Service);

    const service = dic.get('service');
    service.test();
  });

  it('proxy - get trap', () => {
    class Service {
      test() {
        //console.log('Proxy passed!');//XXX
      }
    }

    function logger(msg) {
      console.log(msg);//XXX
    }

    class ClassMethodsProxyHandler {
      constructor(name) {
        this.proxiedMethods = {};
        this.name = name;
      }

      get(target, property, receiver) {
        if (!_.isFunction(target[property])) {
          return target[property];
        }

        if (this.proxiedMethods[property]) {
          //console.log(`>>> Proxied already: ${this.name}.${property}`);//XXX
          return this.proxiedMethods[property];
        }

        //console.log(`>>> Proxying: ${this.name}.${property}`);//XXX

        return this.proxiedMethods[property] = (...args) => {
          return target[property].apply(target, args);
        };
      }
    }

    const dic = new Dic();

    dic.factoryListener = function(instance, def) {
      return new Proxy(instance, new ClassMethodsProxyHandler(def.name));
    };

    dic.class('service', Service);

    const service = dic.get('service');

    service.test('arg1', 'arg2');
    service.test('arg1', 'arg2');
    service.test('arg1', 'arg2');
  });
});
