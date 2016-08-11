module.exports = class Consumer {
  constructor(options, cache) {
    this.options = options;
    this.cache = cache;
    this.init = false;
  }

  *asyncInit() {
    console.log('>>> Consumer async init. Options: ', this.options);//XXX
    this.init = true;
  }

  test() {
    if (!this.init) {
      throw new Error('Consumer not initialized');
    }

    return this.cache.get('key');
  }
};
