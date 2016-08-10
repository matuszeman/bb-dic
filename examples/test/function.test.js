const { dic } = require('./bootstrap');

const fn = require('../services/function');

describe('Consumer app instance', function() {
  it('calls consumer.test()', function*() {
    const value = fn();
    console.log(value);//XXX
  });
});
