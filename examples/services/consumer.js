const Consumer = require('../src/consumer');
const config = require('../service-config');
module.exports = new Consumer(config.consumer, require('./cache'));
