const {expect} = require('chai');
const {Dic, DicConfigLoader} = require('../src');

describe('Example: DicConfigLoader', () => {
  it('options and aliases', () => {
    const config = {
      options: {
        serviceOne: {
          my: 'options'
        }
      },
      aliases: {
        serviceOneAlias: 'serviceOne'
      }
    };

    class ServiceOne {
      constructor(serviceOneOpts) {
        this.options = serviceOneOpts;
      }
    }

    const dic = new Dic();

    dic.class('serviceOne', ServiceOne);

    const loader = new DicConfigLoader();
    loader.loadConfig(dic, config);

    const service = dic.get('serviceOneAlias');
    expect(service).instanceof(ServiceOne);
    expect(service.options).eql(config.options.serviceOne);
  });
});
