const {expect} = require('chai');
const {Dic} = require('../src');

describe('Example: Dependency stack error', () => {
  it('shows dependency stack in the error message', async () => {
    const dic = new Dic();

    class Service {
      constructor(subService) {
      }
    }

    class SubService {
      //notService is not defined therefore it will throw an error
      constructor(subServiceOpts, notService) {
      }
    }

    dic.class('service', Service);
    dic.class('subService', SubService);
    dic.instance('subServiceOpts', {some: 'opts'});

    expect(() => {
      dic.get('service');
    }).throw('[service > subService > notService]')
  });
});
