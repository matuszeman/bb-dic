module.exports = class Consumer {
  constructor(cache) {
    this.cache = cache;
    this.init = false;
  }

  *asyncInit() {
    console.log('>>> Consumer async initialization');//XXX
    this.init = true;
  }

  test() {
    if (!this.init) {
      throw new Error('Consumer not initialized');
    }

    return this.cache.get('key');
  }
};
