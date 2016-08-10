require('./bootstrap');

const expect = require('chai').expect;

const consumer = require('../services/consumer');

describe('"Consumer" app instance', function() {
  describe('.test()', function() {
    it('uses test stub cache', function*() {
      const value = consumer.test();
      expect(value).equal('TEST CACHE VALUE');
    });
  });
});
