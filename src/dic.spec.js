const expect = require('chai').expect;
const Dic = require('./dic');

class Test {
  constructor(testOpts) {

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
  });
});
