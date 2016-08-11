'use strict';

module.exports = class GeneratorProxyTrap {
  constructor(generator, params) {
    this.generator = generator;
    this.params = params;
    this.target = null;
  }

  *asyncInit() {
    this.target = yield this.generator.apply(this.generator, this.params);
  }

  get(target, property, reciever) {
    if (property === 'asyncInit') {
      return this.asyncInit.bind(this);
    }

    if (!this.target) {
      throw new Error('Proxy target not initialized - did you run asyncInit()?');
    }

    return this.target[property];
  }
};

