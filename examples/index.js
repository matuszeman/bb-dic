const co = require('co');

const {Dic, DicRequireLoader} = require('./../index');

//console.log(global);//XXX

const dic = new Dic();
//dic.instance('services/function', function() {
//  console.log('Yeaah!');//XXX
//});

const requireLoader = new DicRequireLoader({
  rootDir: __dirname,
  exclude: [
    'src'
  ]
}, dic);
requireLoader.enable();

console.log('====================== APP =======================');//XXX

const fn = require('./services/function');
dic.alias('services/function', 'function');

console.log('====================== RUN =======================');//XXX

co(function*() {
  //async init
  yield dic.asyncInit();

  //const fn = dic.get('function');
  console.log(fn());//XXX
}).then(console.log).catch(console.error);
