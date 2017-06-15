const ServiceA = require('./service-a');

module.exports = async function() {
  return new ServiceA();
};
