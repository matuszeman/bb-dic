const { dic } = require('../bootstrap');

//test stubs replacing real application services
dic.instance('services/cache', {
  get: function(key) {
    return 'TEST CACHE VALUE';
  }
});

before(function*() {
  yield dic.asyncInit();
});

module.exports = {
  dic
};
