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
    // some async await calls to get this instance intialized (or promise can be used too!)
    this.asyncMsg = 'Perfect, async initialized!';
  }

}
dic.registerClass('asyncService', AsyncService);

class AsyncPromiseService extends AbstractService {
  /**
   * >>> 2. You can also return an promise.
   */
  asyncInit() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.asyncMsg = 'Perfect, async initialized!';
        resolve();
      }, 2000);
    });
  }
}
dic.registerClass('asyncPromiseService', AsyncPromiseService);

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
dic.registerClass('customAsyncInitService', CustomAsyncInitService, {
  asyncInit: 'customAsyncInit'
});

dic.registerAsyncFactory('asyncFactory', async function() {
  return {
    showOff: () => {
      console.log('Async factory works too!')
    }
  }
});

dic.registerFactory('myApp', function(asyncService, asyncPromiseService, customAsyncInitService, asyncFactory) {
  return function() {
    // some application code
    asyncService.showOff();
    asyncPromiseService.showOff();
    customAsyncInitService.showOff();
    asyncFactory.showOff();
  }
});

// use it
dic.asyncInit().then(() => {
  const app = dic.get('myApp');
  app();
});
