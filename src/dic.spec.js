const expect = require('chai').expect;
const sinon = require('sinon');
const Dic = require('./dic');

class Test {
  constructor(testOpts) {
  }
}

class OneConcrete {
}

class Two {
  constructor(one) {
    this.one = one;
  }
}

describe('Dic', () => {
  before(function() {
    this.expect = {
      instanceof: async (ins, classDef) => {
        expect(this.dic.get(ins)).instanceof(classDef);
        expect(await this.dic.getAsync(ins)).instanceof(classDef);
      }
    }
  });

  beforeEach(function() {
    this.dic = new Dic();
  });

  describe('.factory()', () => {
    it('accepts function() {}', async function() {
      this.dic.factory('test', function(arg1) {});
    });

    it('accepts function fnName() {}', async function() {
      this.dic.factory('test', function fnName(arg1) {});
    });

    it('accepts () => {}', async function() {
      this.dic.factory('test', (arg1) => {});
    });
  });

  describe('.class()', () => {
    describe('opts: paramsAlias', () => {
      it('works', async function() {
        this.dic.instance('testOptsAlias', {
          alias: 'opts'
        });
        this.dic.class('test', Test, {
          paramsAlias: {
            testOpts: 'testOptsAlias'
          }
        });
        await this.expect.instanceof('test', Test);
      });
    });
  });

  describe('.get()', () => {
    beforeEach(function() {
      this.dic.instance('testOpts', {
        my: 'opts'
      });
      this.dic.class('test', Test);
    });

    it('resolves the instance', async function() {
      await this.expect.instanceof('test', Test);
    });

    it('dep injection on factory', function() {
      const {dic} = this;

      dic.class('one', OneConcrete);
      dic.class('two', Two);

      dic.factory('fac', function(one, two) {
        one.test = true;
        return {
          one,
          two
        }
      });

      const ret = dic.get('fac');
      expect(ret.one).equal(ret.two.one);
    });
  });

  describe('.getAsync()', () => {
    /**
     * covering bug when services in getServicesAsync() were instantiated in parallel so it created two instances
     */
    it('should inject same objects', async function() {
      const {dic} = this;

      dic.class('one', OneConcrete);
      dic.class('two', Two);

      dic.factory('fac', function(one, two) {
        one.test = true;
        return {
          one,
          two
        }
      });

      const ret = await dic.getAsync('fac');
      expect(ret.one).equal(ret.two.one);
    });

    it('uses same promise on parallel getAsync call', async function() {
      const {dic} = this;
      const spy = sinon.spy();

      const fac = async () => {
        spy();
      };

      dic.asyncFactory('fac', fac);

      // calls in parallel
      await Promise.all([
        dic.getAsync('fac'),
        dic.getAsync('fac')]);

      sinon.assert.calledOnce(spy);
    })
  });

  describe('.alias()', () => {
    beforeEach(function() {
      this.dic.class('oneConcrete', OneConcrete);
      this.dic.class('two', Two);
      this.dic.alias('oneConcrete', 'one');
    });

    it('get same instance', function() {
      const {dic} = this;
      expect(dic.get('one')).equal(dic.get('oneConcrete'));
    });

    it('dep injection with alias', function() {
      const {dic} = this;
      expect(dic.get('one')).equal(dic.get('two').one);
    });

    it('async dep injection with alias', async function() {
      const {dic} = this;
      const one = await dic.getAsync('one');
      const two = await dic.getAsync('two');
      expect(one).equal(two.one);
    });
  });

  describe('.createInstanceAsync()', () => {
    beforeEach(function() {
      this.dic.class('one', OneConcrete);
    });

    it('inject works', async function() {
      const {dic} = this;
      const dummy = {dummy: 'object'};
      const ins = await dic.createInstanceAsync({
        class: Two,
        inject: {
          one: dummy
        }
      });
      expect(ins.one).equal(dummy);
    });
  });
});
