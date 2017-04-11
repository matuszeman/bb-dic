const {Dic, DicConfigLoader} = require('../src');
const dic = new Dic({
  debug: true
});

dic.class('serviceOne', class ServiceOne {
  constructor(serviceOneOpts) {
    console.log('ServiceOne constructor', serviceOneOpts);//XXX
  }
});

const loader = new DicConfigLoader();
loader.loadConfig(dic, {
  options: {
    serviceOne: {
      my: 'options'
    }
  },
  aliases: {
    serviceOneAlias: 'serviceOne'
  }
});

dic.get('serviceOneAlias');
