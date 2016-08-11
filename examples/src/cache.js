module.exports = class Cache {
  constructor(options) {
    this.options = options;
  }

  *asyncInit() {
    console.log('>>> Cache async init. Options: ', this.options);//XXX
    this.dbConnection = true;
  }

  get(key) {
    if(!this.dbConnection) {
      throw new Error('Db connection not ready');
    }

    return 'REAL CACHE VALUE';
  }
};
