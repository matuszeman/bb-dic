const {Dic, DicRequireLoader} = require('./../index');

const dic = new Dic();
const requireLoader = new DicRequireLoader({
  rootDir: __dirname,
  exclude: [
    'src',
    'test'
  ]
}, dic);
requireLoader.enable();

//app config
dic.instance('./service-config', {
  cache: {
    ttl: 1000
  },
  consumer: {
    my: 'APP options'
  }
});

module.exports = {
  dic
};
