# bb-dic

[![Build Status](https://travis-ci.org/matuszeman/bb-dic.svg?branch=master)](https://travis-ci.org/matuszeman/bb-dic)

A dependency injection container with async support.

# Installation

```
npm install @kapitchi/bb-dic
```

# Usage

For ES5/ES6 compatible implementation use `require('@kapitchi/bb-dic/es5')`.

DIC uses [acorn](https://www.npmjs.com/package/acorn) to parse the code to discover function parameters.  
If you encounter parsing issues try to fiddle with `ecmaVersion` parameter (default 8).

See `examples` folder for full usage examples.

Framework usage examples can be found [at the bottom](#framework-usage-examples).

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

const {Dic} = require('@kapitchi/bb-dic');
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

Use when one of your class instances or instance factories needs async initialization.
```
const {Dic} = require('@kapitchi/bb-dic');
const dic = new Dic();

class AsyncService {
  async asyncInit() {
    // some async await calls
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

// Creates myApp service and instantiate all its direct dependencies
dic.getAsync('myApp').then(app => {
  app();
});
```


# API

{{>main}}

# Framework usage examples

Run on NodeJS 7.* with `--harmony` flag

## [Koa](http://koajs.com/)
```
const Koa = require('koa');
const {Dic} = require('@kapitchi/bb-dic');

const dic = new Dic();
dic.instance('functionMiddlewareOpts', { returnString: 'Hello World' });

dic.factory('functionMiddleware', function(functionMiddlewareOpts) {
  return async (ctx) => {
    console.log('functionMiddleware > before');//XXX
    ctx.body = functionMiddlewareOpts.returnString;
    console.log('functionMiddleware > after');//XXX
  }
});

dic.class('classMiddleware', class ClassMiddleware {
  async asyncInit() {
    // some async initialization
  }

  async middlewareOne(ctx, next) {
    console.log('classMiddleware.middlewareOne > before');//XXX
    await next();
    console.log('classMiddleware.middlewareOne > after');//XXX
  }
});

dic.factory('app', function(
  classMiddleware,
  functionMiddleware
) {
  const app = new Koa();

  app.use(classMiddleware.middlewareOne);
  app.use(functionMiddleware);

  return app;
});

dic.getAsync('app').then(app => {
  app.listen(3000);
  console.log('Running at: http://localhost:3000');
})
```

## [Hapi](https://hapijs.com/)
```
const Hapi = require('hapi');
const {Dic} = require('@kapitchi/bb-dic');

const dic = new Dic();
dic.instance('functionHandlerOpts', {
  response: {
    msg: 'Hello from function handler'
  }
});
dic.instance('classHandlerOpts', {
  response: {
    msg: 'Hello from class handler'
  }
});

dic.factory('functionHandler', function (functionHandlerOpts) {
  return async (request, reply) => {
    reply(functionHandlerOpts.response);
  }
});

dic.class('classHandler', class ClassHandler {
  constructor(classHandlerOpts) {
    this.options = classHandlerOpts;
  }

  async asyncInit() {
    // some async initialization
  }

  async handler(request, reply) {
    reply(this.options.response);
  }
});

dic.factory('server', function(
  functionHandler,
  classHandler
) {
  const server = new Hapi.Server();
  server.register([
    require('hapi-async-handler')
  ], function(err) {
    if (err) {
      throw err;
    }
  });

  server.connection({
    host: 'localhost',
    port: 8000
  });

  server.route({
    method: 'GET',
    path: '/func',
    handler: {
      async: functionHandler
    }
  });

  server.route({
    method: 'GET',
    path: '/class',
    handler: {
      async: classHandler.handler.bind(classHandler)
    }
  });

  return server;
});

dic.getAsync('server').then(server => {
  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log('Server running at:', server.info.uri);
  });
});
```

# Development

Run the command below to builds es5 folder and README.md.

```
npm run build
```

## Tests

```
npm test
```

# Contribute

Please feel free to submit an issue/PR or contact me at matus.zeman@gmail.com.

# License

[MIT](LICENSE)
