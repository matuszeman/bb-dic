const classA = require('./classA');
module.exports = function() {
  console.log('Runnign ClassA.test() from the function');//XXX
  classA.test();
};

module.exports['asyncInit'] = function*() {
  console.log('>>> function init');//XXX
};
