const {Dic, DicClassLoader} = require('../src');

const dic = new Dic({
  debug: true
});

const loader = new DicClassLoader(dic, {
  rootDir: __dirname
});
loader.loadPath('src/*.js');

dic.class('app', class App {
  constructor(serviceOne, serviceTwo) {
    console.log('App constructor', serviceOne, serviceTwo);//XXX
  }
});

//instantiate app
dic.get('app');
