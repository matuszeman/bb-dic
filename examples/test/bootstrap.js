const { dic } = require('../bootstrap');

//test stubs replacing real application services
dic.instance('./services/cache', {
  get: function(key) {
    return 'TEST CACHE VALUE';
  }
});

const config = dic.get('./service-config');
config.consumer.my = 'TEST options';

before(function*() {
  yield dic.asyncInit();
});

module.exports = {
  dic
};
