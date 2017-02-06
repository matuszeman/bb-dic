const {Dic} = require('../src');
const dic = new Dic({
  debug: true
});

class MyService {
  constructor(myServiceOpts) {
    this.options = myServiceOpts;
  }

  showOff() {
    console.log('My options are:', this.options);
  }
}

// register all instances
dic.registerInstance('myServiceOpts', { some: 'thing' });
dic.registerClass('myService', MyService);
dic.registerFactory('myApp', function(myService) {
  return function() {
    // some application code
    myService.showOff();
  }
});

// use it
const app = dic.get('myApp');
app();
