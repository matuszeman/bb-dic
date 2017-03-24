# bb-dic

A dependency injection container.

# Installation

```
npm install matuszeman/bb-dic
```

# Usage

For ES5 compatible implementation use `require('bb-dic/es5')`.

See `examples` folder for full usage examples.

## Sync usage

```
class MyService {
  constructor(myServiceOpts) {
    this.options = myServiceOpts;
  }

  showOff() {
    console.log('My options are:', this.options);
  }
}

const {Dic} = require('bb-dic');
const dic = new Dic();

// register all instances
dic.instance('myServiceOpts', { some: 'thing' });
dic.class('myService', MyService);
dic.factory('myApp', function(myService) {
  return function() {
    // some application code
    myService.showOff();
  }
});

// use it
const app = dic.get('myApp');
app();
```

## Async usage

You might want to use classes which needs to be initialized asynchronously or various instances which needs async instantiation.
```
const {Dic} = require('bb-dic');
const dic = new Dic();

class AsyncService {
  async asyncInit() {
    // some async await calls to get this instance intialized (or promise can be used too!)
  }

  showOff() {
    console.log('Perfect, all works!');
  }
}
dic.class('asyncService', AsyncService);

dic.asyncFactory('asyncMsg', async function() {
  // some async calls needed to create an instance of this service
  return 'Async helps the server.';
})

dic.factory('myApp', function(asyncService, asyncMsg) {
  return function() {
    // some application code with all services ready
    myService.showOff();
    console.log(asyncMsg);
  }
});

// Instantiate all container's async services and runs myApp - "shouldNotRun" service is also created
//dic.asyncInit().then(() => {
//  const app = dic.get('myApp');
//  app();
//});

// OR: Creates myApp service and instantiate all its direct dependencies - "shouldNotRun" service is skipped
dic.getAsync('myApp').then(app => {
  app();
});
```

# API

{{>main}}
