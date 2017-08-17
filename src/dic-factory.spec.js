const expect = require('chai').expect;
const EventEmitter = require('events');
const {DicFactory} = require('./index');

describe('DicFactory', () => {
  describe('.createEmitterPromise()', () => {
    it('resolve the promise', function(done) {
      const emitter = new EventEmitter();

      const promise = DicFactory.createEmitterPromise(emitter, 'ready', 'myerror');
      promise.then(() => {
        done();
      }).catch((err) => {
        done(new Error('Catch should not be called'));
      });

      setTimeout(() => {
        emitter.emit('ready');
        emitter.emit('myerror');
      });
    });

    it('reject the promise', function(done) {
      const emitter = new EventEmitter();

      const promise = DicFactory.createEmitterPromise(emitter, 'ready', 'myerror');
      promise.then(() => {
        done(new Error('Then should not be called'));
      }).catch((err) => {
        done();
      });

      setTimeout(() => {
        emitter.emit('myerror');
        emitter.emit('ready');
      });
    });
  });
});
