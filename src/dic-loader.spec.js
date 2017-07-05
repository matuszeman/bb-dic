const expect = require('chai').expect;
const {Dic, DicLoader} = require('./index');

const ServiceA = require('../test/dic-loader/service-a');
const SubOne = require('../test/dic-loader/sub/one');

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

      dicLoader.loadPath(dic, '**/*.js', {
        prefix: 'x'
      });
      await dic.asyncInit();

      await this.expect.instanceof(dic, 'xServiceA', ServiceA);
      await this.expect.instanceof(dic, 'xServiceB', ServiceA);
      await this.expect.instanceof(dic, 'xServiceC', ServiceA);
      await this.expect.instanceof(dic, 'xServiceD', ServiceA);
      await this.expect.instanceof(dic, 'xSubOne', SubOne);
    });
  });

});
