const expect = require('chai').expect;
const {Dic, DicLoader} = require('./index');

const ServiceA = require('../test/dic-loader/service-a');

describe('DicLoader', () => {
  before(function() {
    this.expect = {
      instanceof: async (dic, ins, classDef) => {
        expect(dic.get(ins)).instanceof(classDef);
        expect(await dic.getAsync(ins)).instanceof(classDef);
      }
    }
  });

  beforeEach(function() {
    this.dic = new Dic();
    this.dicLoader = new DicLoader({
      rootDir: __dirname + '/../test/dic-loader'
      //debug: true
    });
  });

  describe('.loadPath()', () => {
    it('works', async function() {
      const {dic, dicLoader} = this;

      dicLoader.loadPath(dic, '*.js');
      await dic.asyncInit();

      await this.expect.instanceof(dic, 'serviceA', ServiceA);
      await this.expect.instanceof(dic, 'serviceB', ServiceA);
      await this.expect.instanceof(dic, 'serviceC', ServiceA);
      await this.expect.instanceof(dic, 'serviceD', ServiceA);
    });
  });

});
