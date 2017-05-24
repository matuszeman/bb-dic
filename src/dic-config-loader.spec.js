const expect = require('chai').expect;
const {Dic, DicConfigLoader} = require('./index');

class Service1 {
  constructor(service1Opts) {
    this.options = service1Opts;
  }
}

describe('DicConfigLoader', () => {
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
    this.dicConfigLoader = new DicConfigLoader();
  });

  describe('.loadConfig()', () => {
    describe('opts: aliases, options', () => {
      it('works', async function() {
        const {dic, dicConfigLoader} = this;

        dic.class('service1', Service1);

        dicConfigLoader.loadConfig(dic, {
          options: {
            service1: {}
          },
          aliases: {
            service2: 'service1'
          }
        });

        await this.expect.instanceof(dic, 'service1', Service1);
        await this.expect.instanceof(dic, 'service2', Service1);
      });
    });

    describe('opts: binding, imports', () => {
      it('works', async function() {
        const {dic, dicConfigLoader} = this;

        const package1Dic = new Dic();
        dic.bind(package1Dic, {
          name: 'package1'
        });

        dic.class('service1', Service1);

        dicConfigLoader.loadConfig(dic, {
          options: {
            service1: {}
          },
          aliases: {
            service2: 'service1'
          },
          bindings: {
            package1: {
              imports: {
                service1: 'service2'
              }
            }
          }
        });

        await this.expect.instanceof(dic, 'service1', Service1);
        await this.expect.instanceof(dic, 'service2', Service1);
        await this.expect.instanceof(package1Dic, 'service1', Service1);
      });
    });
  });
});
