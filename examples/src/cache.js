module.exports = class Cache {
  *asyncInit() {
    console.log('>>> Cache async initialization');//XXX
    this.dbConnection = true;
  }

  get(key) {
    if(!this.dbConnection) {
      throw new Error('Db connection not ready');
    }

    return 'REAL CACHE VALUE';
  }
};
