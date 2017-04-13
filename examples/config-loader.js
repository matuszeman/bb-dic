const {Dic, DicConfigLoader} = require('../src');

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

const dic = new Dic({
  debug: true
});

dic.class('serviceOne', class ServiceOne {
  constructor(serviceOneOpts) {
    console.log('ServiceOne constructor', serviceOneOpts);//XXX
  }
});

const loader = new DicConfigLoader();
loader.loadConfig(dic, config);

dic.get('serviceOneAlias');
