const {Dic, DicLoader} = require('../src');

const dic = new Dic({
  debug: true
});

const loader = new DicLoader({
  rootDir: __dirname
});
loader.loadPath(dic, 'src/*.js');

dic.class('app', class App {
  constructor(serviceOne, serviceTwo) {
    console.log('App constructor', serviceOne, serviceTwo);//XXX
  }
});

//instantiate app
dic.get('app');
