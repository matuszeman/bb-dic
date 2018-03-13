const expect = require('chai').expect;
const {Dic, DicLoader} = require('./index');

const ServiceA = require('../test/dic-loader/service-a');
const SubOne = require('../test/dic-loader/sub/one');
const SubTwo = require('../test/dic-loader/sub/sub-two');
const SubSuboverService= require('../test/dic-loader/sub/subover-service');

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

  describe('#loadPath()', () => {
    it('opts.removeDuplicate=true', async function() {
      const {dic, dicLoader} = this;

      dicLoader.loadPath(dic, '**/*.js', {
        removeDuplicate: true,
      });
      await dic.asyncInit();

      await this.expect.instanceof(dic, 'subTwo', SubTwo);
      await this.expect.instanceof(dic, 'subSuboverService', SubSuboverService);
    });

    it('works with prefix/postfix', async function() {
      const {dic, dicLoader} = this;

      dicLoader.loadPath(dic, '**/*.js', {
        prefix: 'x',
        postfix: 'z',
      });
      await dic.asyncInit();

      await this.expect.instanceof(dic, 'xServiceAZ', ServiceA);
      await this.expect.instanceof(dic, 'xServiceBZ', ServiceA);
      await this.expect.instanceof(dic, 'xServiceCZ', ServiceA);
      await this.expect.instanceof(dic, 'xServiceDZ', ServiceA);
      await this.expect.instanceof(dic, 'xSubOneZ', SubOne);
      await this.expect.instanceof(dic, 'xSubSubTwoZ', SubTwo);
      await this.expect.instanceof(dic, 'xSubSuboverServiceZ', SubSuboverService);
    });

    it('works', async function() {
      const {dic, dicLoader} = this;

      dicLoader.loadPath(dic, '**/*.js');
      await dic.asyncInit();

      await this.expect.instanceof(dic, 'serviceA', ServiceA);
      await this.expect.instanceof(dic, 'serviceB', ServiceA);
      await this.expect.instanceof(dic, 'serviceC', ServiceA);
      await this.expect.instanceof(dic, 'serviceD', ServiceA);
      await this.expect.instanceof(dic, 'subOne', SubOne);
      await this.expect.instanceof(dic, 'subSubTwo', SubTwo);
      await this.expect.instanceof(dic, 'subSuboverService', SubSuboverService);
    });
  });

});
