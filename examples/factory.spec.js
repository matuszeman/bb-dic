const {expect} = require('chai');
const SubOne = require('../test/dic-loader/sub/one');
const {DicFactory} = require('../src');

describe('Example: DicFactory', () => {
  it('Instantiate dic using the factory, uses loader and config loader to register services', async () => {
    const config = {
      options: {
        testService: 'some'
      }
    };

    const {dic} = DicFactory.createDic({
      //debug: true,
      loaderRootDir: __dirname + '/../test/dic-loader',
      loaderPath: '**/*.js',
      config
    });

    expect(dic.get('subOne')).instanceof(SubOne);
    expect(dic.get('testServiceOpts')).eql('some');
  });
});
