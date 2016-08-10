require('./bootstrap');

const expect = require('chai').expect;

const fn = require('../services/function');

describe('"function" app instance', function() {
  it('calls consumer.test()', function*() {
    const value = fn();
    expect(value).equal('TEST CACHE VALUE');
  });
});
