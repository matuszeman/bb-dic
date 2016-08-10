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

module.exports = {
  dic
};
