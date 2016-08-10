const { dic } = require('./bootstrap');

const consumer = require('../services/consumer');

describe('Consumer app instance', function() {
  before(function*() {
    yield dic.asyncInit();
  });

  describe('.test()', function() {
    it('uses test stub cache', function*() {
      const value = consumer.test();
      console.log(value);//XXX
    });
  });
});
