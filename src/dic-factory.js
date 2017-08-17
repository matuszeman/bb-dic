module.exports = class DicFactory {
  static createCallbackPromise(fn) {
    let resolve, reject;
    const ready = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
    fn(err => err ? reject(err) : resolve());
    return ready;
  }

  static createEmitterPromise(emitter, resolveEvent, rejectEvent) {
    let resolve, reject, resolveListener, rejectListener;

    const ready = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

    resolveListener = () => {
      if (rejectEvent) {
        emitter.removeListener(rejectEvent, rejectListener);
      }
      resolve(emitter);
    };

    emitter.once(resolveEvent, resolveListener);

    if (rejectEvent) {
      rejectListener = (err) => {
        emitter.removeListener(resolveEvent, resolveListener);
        reject(err);
      };
      emitter.once(rejectEvent, rejectListener);
    }

    return ready;
  }
};
