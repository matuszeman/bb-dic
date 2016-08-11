const co = require('co');

const { dic } = require('./bootstrap');

console.log('====================== APP =======================');//XXX

const fn = require('./services/function');
//dic.alias('./services/function', 'function');

console.log('====================== RUN =======================');//XXX

co(function*() {
  //async init
  yield dic.asyncInit();

  //const fn = dic.get('function');
  console.log(fn());//XXX
}).then(console.log).catch(console.error);
