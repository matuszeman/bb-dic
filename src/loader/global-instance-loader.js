'use strict';

const _ = require('lodash');

class GlobalInstanceLoader {
  hasInstance(name) {
    return _.has(global, name);
  }

  getInstance(name) {
    if(!this.hasInstance(name)) {
      throw new Error(`Unknown global instance ${name}`);
    }

    return global[name];
  }
}
