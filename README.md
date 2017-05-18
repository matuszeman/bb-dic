# bb-dic

A dependency injection container.

# Installation

```
npm install matuszeman/bb-dic
```

# Usage

For ES5/ES6 compatible implementation use `require('bb-dic/es5')`.

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

Use when one of your class instances or instance factories needs async initialization.
```
const {Dic} = require('bb-dic');
const dic = new Dic();

class AsyncService {
  async asyncInit() {
    // some async await calls (or promise can be used too!)
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

// Instantiate all container's async services and runs myApp
dic.asyncInit().then(() => {
  const app = dic.get('myApp');
  app();
});

// OR: Creates myApp service and instantiate all its direct dependencies
dic.getAsync('myApp').then(app => {
  app();
});
```


# API

## Classes

<dl>
<dt><a href="#DicClassLoader">DicClassLoader</a></dt>
<dd><p>Class loader</p>
</dd>
<dt><a href="#DicConfigLoader">DicConfigLoader</a></dt>
<dd><p>Config loader - sets up Dic from the config (plain object)</p>
</dd>
<dt><a href="#Dic">Dic</a></dt>
<dd><p>Dependency injection container</p>
<p>For more usage examples see: <a href="#Dic+instance">instance</a>, <a href="#Dic+class">class</a>, <a href="#Dic+factory">factory</a>,
<a href="#Dic+asyncFactory">asyncFactory</a>, <a href="#Dic+bindChild">bindChild</a>.</p>
</dd>
</dl>

<a name="DicClassLoader"></a>

## DicClassLoader
Class loader

**Kind**: global class  

* [DicClassLoader](#DicClassLoader)
    * [new DicClassLoader(dic, opts)](#new_DicClassLoader_new)
    * [.loadPath(path)](#DicClassLoader+loadPath)

<a name="new_DicClassLoader_new"></a>

### new DicClassLoader(dic, opts)

| Param | Type | Description |
| --- | --- | --- |
| dic | <code>[Dic](#Dic)</code> |  |
| opts | <code>Object</code> |  |
| opts.rootDir | <code>string</code> | Absolute path to root folder of source files. Default: `process.cwd()` |

<a name="DicClassLoader+loadPath"></a>

### dicClassLoader.loadPath(path)
Load all files and register exported classes to [Dic](#Dic).

All files are expected to export a class.

File name dictates what name the service will be registered as.
E.g. `my-service.js` service would become registered as `myService` => file name is camelCased.

**Kind**: instance method of <code>[DicClassLoader](#DicClassLoader)</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | glob expression [https://www.npmjs.com/package/globby](https://www.npmjs.com/package/globby) |

**Example**  
```js
// Registers all classes under `CWD/src` folder.

const {Dic, DicClassLoader} = require('bb-dic');
const dic = new Dic();
const loader = new DicClassLoader(dic);
loader.loadPath('src/*.js');

module.exports = dic;
```
<a name="DicConfigLoader"></a>

## DicConfigLoader
Config loader - sets up Dic from the config (plain object)

**Kind**: global class  

* [DicConfigLoader](#DicConfigLoader)
    * [new DicConfigLoader(opts)](#new_DicConfigLoader_new)
    * [.loadConfig(dic, config)](#DicConfigLoader+loadConfig)

<a name="new_DicConfigLoader_new"></a>

### new DicConfigLoader(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.optionsSuffix | <code>string</code> | What suffix to use for "options" config. See: [loadConfig](#DicConfigLoader+loadConfig) |

<a name="DicConfigLoader+loadConfig"></a>

### dicConfigLoader.loadConfig(dic, config)
Set up Dic according the config

**Kind**: instance method of <code>[DicConfigLoader](#DicConfigLoader)</code>  

| Param | Type | Description |
| --- | --- | --- |
| dic | <code>[Dic](#Dic)</code> |  |
| config | <code>Object</code> |  |
| [config.options] | <code>Object</code> | Create plain object "option" instances |
| [config.aliases] | <code>Object</code> | Create aliases |
| [config.bindings] | <code>Object</code> | Set up bind Dic |

**Example**  
```js
{
  options: {
    service1: { } // {} is registered as "service1Opts" instance
  },
  aliases: {
    service2: 'service1' // "service1" is aliased to "service2"
  },
  bindings: {
    package1: { // bind container name
      imports: {
        serviceA: 'service1' // "service1" from main container is imported into "package1" container as "serviceA"
      },
      //options for bind container, same as for main container i.e. `options`, `aliases`, ...
    }
  }
}
```
<a name="Dic"></a>

## Dic
Dependency injection container

For more usage examples see: [instance](#Dic+instance), [class](#Dic+class), [factory](#Dic+factory),
[asyncFactory](#Dic+asyncFactory), [bindChild](#Dic+bindChild).

**Kind**: global class  

* [Dic](#Dic)
    * [new Dic(options)](#new_Dic_new)
    * [.asyncFactory(name, factory)](#Dic+asyncFactory)
    * [.factory(name, factory)](#Dic+factory)
    * [.instance(name, instance)](#Dic+instance)
    * [.class(name, classDef, opts)](#Dic+class)
    * [.asyncInit()](#Dic+asyncInit)
    * [.has(name)](#Dic+has) ⇒ <code>boolean</code>
    * [.get(name)](#Dic+get) ⇒ <code>\*</code>
    * [.getAsync(name)](#Dic+getAsync) ⇒ <code>\*</code>
    * [.alias(name, alias)](#Dic+alias)
    * [.bindChild(dic, opts)](#Dic+bindChild)
    * [.createInstance(def, opts)](#Dic+createInstance) ⇒ <code>\*</code>
    * [.createInstanceAsync(def, opts)](#Dic+createInstanceAsync) ⇒ <code>\*</code>

<a name="new_Dic_new"></a>

### new Dic(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.containerSeparator | <code>String</code> | Container / service name separator. Default `_`. See [bindChild](#Dic+bindChild) |
| options.debug | <code>boolean</code> | Debug on/off |

**Example**  
```js
// Dependency injection example
class MyService {
  constructor(myServiceOpts) {
    this.options = myServiceOpts;
  }
}

const {Dic} = require('bb-dic');
const dic = new Dic();

dic.instance('myServiceOpts', { some: 'thing' });

const myService = dic.get('myService');
```
<a name="Dic+asyncFactory"></a>

### dic.asyncFactory(name, factory)
Registers async factory.

Factory function is called asynchronously and should return an instance of the service.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param |
| --- |
| name | 
| factory | 

**Example**  
```js
dic.instance('mongoConnectionOpts', { url: 'mongodb://localhost:27017/mydb' });
dic.asyncFactory('mongoConnection', async function(mongoConnectionOpts) {
  return await MongoClient.connect(mongoConnectionOpts.url);
});
```
<a name="Dic+factory"></a>

### dic.factory(name, factory)
Register a factory.

The factory function should return an instance of the service.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param |
| --- |
| name | 
| factory | 

**Example**  
```js
dic.instance('myServiceOpts', { some: 'thing' })
dic.factory('myService', function(myServiceOpts) {
  return new MyService(myServiceOpts);
});
```
<a name="Dic+instance"></a>

### dic.instance(name, instance)
Register an instance

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param |
| --- |
| name | 
| instance | 

**Example**  
```js
dic.instance('myScalarValue', 'string');
dic.instance('myObject', { some: 'thing' });
dic.instance('myFunction', function(msg) { console.log(msg) });
```
<a name="Dic+class"></a>

### dic.class(name, classDef, opts)
Register a class

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name |  |  |
| classDef |  |  |
| opts | <code>Object</code> |  |
| opts.asyncInit | <code>boolean</code> &#124; <code>string</code> | If true default asyncInit() function is used. If string, provided function is called on [asyncInit](#Dic+asyncInit). |

**Example**  
```js
// Class instance registration with dependency injection

class MyService {
  constructor(myServiceOpts) {
    this.options = myServiceOpts;
  }
}

dic.instance('myServiceOpts', {
  some: 'options'
})
dic.class('myService', MyService)
```
**Example**  
```js
// Class instance registration with default async init function

class MyService {
  // optional async initialization of an instance
  async asyncInit() {
    //some async initialization e.g. open DB connection.
  }
}

dic.class('myService', MyService)
```
**Example**  
```js
// Custom async init function

class MyService {
  async otherAsyncInitFn() {
    //...
  }
}

dic.class('myService', MyService, {
  asyncInit: 'otherAsyncInitFn'
})
```
<a name="Dic+asyncInit"></a>

### dic.asyncInit()
Runs async initialization of container services.

This includes instances registered using:

 - [asyncFactory](#Dic+asyncFactory)
 - [class](#Dic+class) a class having `async asyncInit()` method or with async init option set

**Kind**: instance method of <code>[Dic](#Dic)</code>  
**Example**  
```js
dic.asyncInit().then(() => {
   // your services should be fully instantiated.
 }, err => {
   // async initialization of some service thrown an error.
   console.error(err);
 });
```
<a name="Dic+has"></a>

### dic.has(name) ⇒ <code>boolean</code>
Returns true if a service is registered with a container

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param |
| --- |
| name | 

<a name="Dic+get"></a>

### dic.get(name) ⇒ <code>\*</code>
Get an instance.

Throws an error if instance needs to be async initialized and is not yet.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 

**Example**  
```js
const myService = dic.get('myService');
```
<a name="Dic+getAsync"></a>

### dic.getAsync(name) ⇒ <code>\*</code>
Get an instance.

Async initialize the instance if it's not yet.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 

**Example**  
```js
// Async/await
const myService = await dic.get('myService');
```
**Example**  
```js
// Promise
dic.getAsync('myService').then(myService => {
  // ...
});
```
<a name="Dic+alias"></a>

### dic.alias(name, alias)
Creates an alias for existing container instance.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | An instance to be aliased |
| alias | <code>String</code> | Alias |

**Example**  
```js
dic.instance('one', 1);
dic.alias('one', 'oneAgain');

dic.get('one') === dic.get('oneAgain')
```
<a name="Dic+bindChild"></a>

### dic.bindChild(dic, opts)
Bind other Dic instance with this one.

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type | Description |
| --- | --- | --- |
| dic | <code>[Dic](#Dic)</code> |  |
| opts | <code>Object</code> |  |
| opts.name | <code>String</code> | Container services prefix name |

**Example**  
```js
// -----------------------------------------
// my-package.js - reusable package
// -----------------------------------------
const {Dic} = require('bb-dic');

class Logger {
  log(msg) {
    console.log('MyLogger: ' + msg);
  }
}

const dic = new Dic();
dic.instance('logger', Logger);

module.exports = dic;

// -----------------------------------------
// my-application.js - an application itself
// -----------------------------------------
const {Dic} = require('bb-dic');
const packageDic = require('./my-package');

class MyService() {
  constructor(myPackage_logger) {
    // injected logger instance
    this.logger = myPackage_logger;
  }

  sayHello(msg) {
    this.logger.log(msg);
  }
}

const dic = new Dic();
dic.class('myService', MyService);

dic.bindChild(packageDic, {
  name: 'myPackage'
})

// get a child service instance directly
const logger = dic.get('myPackage_logger');
```
<a name="Dic+createInstance"></a>

### dic.createInstance(def, opts) ⇒ <code>\*</code>
Create an instance injecting it's dependencies from the container

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type | Description |
| --- | --- | --- |
| def | <code>Object</code> |  |
| def.factory | <code>function</code> | Factory function |
| def.class | <code>function</code> | Class constructor |
| def.inject | <code>Object</code> |  |
| opts | <code>Object</code> |  |

**Example**  
```js
class MyClass {
  constructor(myClassOpts, someService) {
  }
}

dic.instance('myClassOpts', { my: 'options' });
dic.instance('someService', { real: 'service' });

const ins = dic.createInstance({
  class: MyClass,
  inject: {
    // myClassOpts - injected from dic
    // someService - the below is injected instead of dic registered 'someService'.
    someService: { mock: 'service' }
  }
})
```
<a name="Dic+createInstanceAsync"></a>

### dic.createInstanceAsync(def, opts) ⇒ <code>\*</code>
Create an instance (async) injecting it's dependencies from the container.

See [createInstance](#Dic+createInstance)

**Kind**: instance method of <code>[Dic](#Dic)</code>  

| Param | Type | Description |
| --- | --- | --- |
| def | <code>Object</code> |  |
| def.asyncFactory | <code>function</code> | Async function |
| def.factory | <code>function</code> | Factory function |
| def.class | <code>function</code> | Class constructor |
| def.inject | <code>Object</code> |  |
| opts | <code>Object</code> |  |


# Framework usage examples

Run on NodeJS 7.* with `--harmony` flag

## [Koa](http://koajs.com/)
```
const Koa = require('koa');
const {Dic} = require('bb-dic');

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
const {Dic} = require('bb-dic');

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
