const {expect} = require('chai');
const {Dic} = require('../src');

describe('Example: Async usage', () => {
  it('"async asyncInit() {}"', async () => {
    const dic = new Dic();

    class MyClass {
      async asyncInit() {}
    }

    dic.class('service', MyClass);

    const ins = await dic.getAsync('service');
    expect(ins).instanceof(MyClass);
  });

  it('"asyncInit() {}" returns promise', async () => {
    const dic = new Dic();

    class MyClass {
      asyncInit() {
        return Promise.resolve();
      }
    }

    dic.class('service', MyClass);

    const ins = await dic.getAsync('service');
    expect(ins).instanceof(MyClass);
  });

  it('custom async init function', async () => {
    const dic = new Dic();

    class MyClass {
      async myAsyncFn() {
      }
    }

    dic.class('service', MyClass, {
      asyncInit: 'myAsyncFn'
    });

    const ins = await dic.getAsync('service');
    expect(ins).instanceof(MyClass);
  });

  it('async factory', async () => {
    const dic = new Dic();

    const service = 'Made by async factory';

    dic.asyncFactory('service', async function() {
      return service;
    });

    const ins = await dic.getAsync('service');
    expect(ins).equal(service);
  });

});
