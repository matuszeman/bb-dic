const Cache = require('../src/cache');
const config = require('./../service-config');
module.exports = new Cache(config.cache);
