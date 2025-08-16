// Minimal AsyncLocalStorage shim for environments without Node's async_hooks
class AsyncLocalStorage {
  constructor() {
    this._store = undefined;
  }

  getStore() {
    return this._store;
  }

  run(store, callback) {
    const previous = this._store;
    this._store = store;
    try {
      return callback();
    } finally {
      this._store = previous;
    }
  }
}

module.exports = { AsyncLocalStorage };


