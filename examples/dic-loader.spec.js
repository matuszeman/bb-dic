const {expect} = require('chai');
const {Dic, DicLoader} = require('../src');

describe('Example: DicLoader', () => {
  it('registers all services under a folder', async () => {
    const dic = new Dic();

    const loader = new DicLoader({
      rootDir: __dirname + '/../test/dic-loader'
    });
    loader.loadPath(dic, '**/*.js');

    expect(dic.get('subOne')).exist;
    expect(dic.get('serviceA')).exist;
    expect(dic.get('serviceB')).exist;
    expect(await dic.getAsync('serviceC')).exist;
    expect(dic.get('serviceD')).exist;
  });
});
