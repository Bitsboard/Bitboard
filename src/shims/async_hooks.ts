// Minimal AsyncLocalStorage shim for edge/runtime builds without Node "async_hooks"
// This is sufficient for libraries that only call getStore() and run() per request.

export class AsyncLocalStorage<T> {
	private _store: T | undefined;

	getStore(): T | undefined {
		return this._store;
	}

	run(store: T, callback: (...args: any[]) => any): any {
		const previous = this._store;
		this._store = store;
		try {
			return callback();
		} finally {
			this._store = previous;
		}
	}
}

export default { AsyncLocalStorage };


