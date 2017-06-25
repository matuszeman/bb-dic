const {Dic} = require('../src');
const dic = new Dic({
  debug: true
});

class Service {
  constructor(subService) {
  }
}

class SubService {
  constructor(subServiceOpts, notService) {
  }
}

// register all instances
dic.class('service', Service);
dic.class('subService', SubService);
dic.instance('subServiceOpts', {some: 'opts'});

// use it
dic.createInstance({
  class: Service
});
