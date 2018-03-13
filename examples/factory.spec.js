const {expect} = require('chai');
const SubOne = require('../test/dic-loader/sub/one');
const DepService = require('../test/dic-loader/dep-service');
const {DicFactory} = require('../src');

describe('Example: DicFactory', () => {
  it('Instantiate dic using the factory, uses loader and config loader to register services', async () => {
    const config = {
      options: {
        depService: 'some'
      }
    };

    const {dic} = DicFactory.createDic({
      //debug: true,
      loaderRootDir: __dirname + '/../test/dic-loader',
      loaderPath: '**/*.js',
      config
    });

    expect(dic.get('depService')).instanceof(DepService);
    expect(dic.get('subOne')).instanceof(SubOne);
    expect(dic.get('depServiceOpts')).eql('some');
  });
});
