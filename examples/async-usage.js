const {Dic} = require('../src');
const dic = new Dic({
  debug: true
});

class AbstractService {
  showOff() {
    if (!this.asyncMsg) {
      throw new Error(this.constructor.name + ': AsyncInit did not run!')
    }
    console.log(this.constructor.name + ': ' + this.asyncMsg);
  }
}

class AsyncService extends AbstractService {
  /**
   * >>> 1. For classes, one way of defining async initialization is to define asyncInit() function.
   */
  async asyncInit() {
    // some async await calls to get this instance initialized (or promise can be used too!)
    this.asyncMsg = 'Perfect, async initialized!';
  }

}
dic.class('asyncService', AsyncService);

class AsyncPromiseService extends AbstractService {
  /**
   * >>> 2. You can also return an promise.
   */
  asyncInit() {
    return new Promise((resolve, reject) => {
      console.log('AsyncPromiseService: init - waiting 2 secs');//XXX
      setTimeout(() => {
        console.log('AsyncPromiseService: init done');//XXX
        this.asyncMsg = 'Perfect, async initialized!';
        resolve();
      }, 2000);
    });
  }
}
dic.class('asyncPromiseService', AsyncPromiseService);

class CustomAsyncInitService extends AbstractService {
  /**
   * >>> 3. Or you can define your own async-init function ...
   */
  async customAsyncInit() {
    // await calls here!
    this.asyncMsg = 'Perfect, async initialized!';
  }
}
/**
 * >>> 4. ... but this must be specified when you register the class with the container.
 */
dic.class('customAsyncInitService', CustomAsyncInitService, {
  asyncInit: 'customAsyncInit'
});

dic.asyncFactory('asyncFactory', function() {
  return {
    showOff: () => {
      console.log('Async factory works too!')
    }
  }
});

dic.asyncFactory('shouldNotRun', function() {
  console.log('This should only run when dic.asyncInit() is used.');//XXX
});

dic.factory('myApp', function(asyncService, asyncPromiseService, customAsyncInitService, asyncFactory) {
  return function() {
    // some application code
    asyncService.showOff();
    asyncPromiseService.showOff();
    customAsyncInitService.showOff();
    asyncFactory.showOff();
  }
});

// instantiate all async services withint the container and runs myApp - "shouldNotRun" service is also created
//dic.asyncInit().then(() => {
//  const app = dic.get('myApp');
//  app();
//});

// Creates myApp service and instantiate all its direct dependencies - "shouldNotRun" service is skipped
dic.getAsync('myApp').then(app => {
  app();
});

