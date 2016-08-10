const consumer = require('./consumer');

module.exports = function() {
  console.log('Running Consumer.test() from the function');//XXX
  return consumer.test();
};

module.exports['asyncInit'] = function*() {
  console.log('>>> function init');//XXX
};
