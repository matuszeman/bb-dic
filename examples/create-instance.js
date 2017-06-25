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
dic.instance('myServiceOpts', { some: 'thing' });

dic.createInstanceAsync({
  class: MyService,
  inject: {
    myServiceOpts: {
      other: 123
    }
  }
}).then(ins => {
  console.log(ins);//XXX
});
