/**
 * A simple in-memory Redis mock for development and testing.
 * This implementation provides basic Redis operations without requiring a real Redis server.
 *
 * Uses global state to ensure it's a true singleton across all imports.
 */

type StorageItem = {
	value: string;
	expiry: number | null; // Timestamp in ms when the key expires, or null if no expiry
};

type RedisCallback<T> = (err: Error | null, result: T) => void;

// Use global state to ensure a true singleton
// This avoids issues with multiple instances in Next.js API routes
declare global {
	// eslint-disable-next-line no-var
	var __redisMockStorage: Map<string, StorageItem> | undefined;
}

// Initialize global storage if it doesn't exist
global.__redisMockStorage =
	global.__redisMockStorage || new Map<string, StorageItem>();

export class RedisMock {
	private debug = true; // Set to true for verbose logging during development

	// Use the global storage
	private get storage() {
		return global.__redisMockStorage || new Map<string, StorageItem>();
	}

	constructor() {
		if (this.debug) {
			console.log(
				`RedisMock: Using global storage with ${this.storage.size} items`,
			);
		}
	}

	/**
	 * Set a key-value pair in the storage, optionally with an expiration time
	 */
	set(
		key: string,
		value: string,
		...args: (string | number | RedisCallback<"OK">)[]
	): Promise<"OK"> {
		let expiry: number | null = null;
		let callback: RedisCallback<"OK"> | undefined;

		// Extract callback if it's the last argument
		if (args.length > 0 && typeof args[args.length - 1] === "function") {
			callback = args.pop() as RedisCallback<"OK">;
		}

		// Handle expiration options
		if (args.length >= 2 && args[0] === "EX") {
			const seconds =
				typeof args[1] === "number"
					? args[1]
					: Number.parseInt(args[1] as string, 10);
			if (!Number.isNaN(seconds)) {
				expiry = Date.now() + seconds * 1000;
				if (this.debug) {
					console.log(
						`RedisMock: Setting ${key} with expiry in ${seconds}s (${new Date(expiry).toISOString()})`,
					);
				}
			}
		}

		this.storage.set(key, { value, expiry });

		if (this.debug) {
			console.log(
				`RedisMock: Set ${key} = ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`,
			);
			console.log(`RedisMock: Storage now has ${this.storage.size} items`);
		}

		if (callback) {
			callback(null, "OK");
		}

		return Promise.resolve("OK");
	}

	/**
	 * Get the value of a key
	 */
	get(
		key: string,
		callback?: RedisCallback<string | null>,
	): Promise<string | null> {
		this._removeExpiredKeys();
		const item = this.storage.get(key);
		const result = item ? item.value : null;

		if (this.debug) {
			console.log(`RedisMock: Get ${key} => ${result ? "found" : "not found"}`);
			if (!result) {
				console.log(
					`RedisMock: Available keys: ${Array.from(this.storage.keys()).join(", ")}`,
				);
			}
		}

		if (callback) {
			callback(null, result);
		}

		return Promise.resolve(result);
	}

	/**
	 * Delete one or more keys
	 */
	del(key: string, callback?: RedisCallback<number>): Promise<number> {
		const existed = this.storage.has(key);
		this.storage.delete(key);
		const result = existed ? 1 : 0;

		if (this.debug) {
			console.log(
				`RedisMock: Del ${key} => ${existed ? "deleted" : "not found"}`,
			);
		}

		if (callback) {
			callback(null, result);
		}

		return Promise.resolve(result);
	}

	/**
	 * Check if a key exists
	 */
	exists(key: string, callback?: RedisCallback<number>): Promise<number> {
		this._removeExpiredKeys();
		const result = this.storage.has(key) ? 1 : 0;

		if (callback) {
			callback(null, result);
		}

		return Promise.resolve(result);
	}

	/**
	 * Get all keys matching a pattern (simplified, just returns all keys)
	 */
	keys(pattern: string, callback?: RedisCallback<string[]>): Promise<string[]> {
		this._removeExpiredKeys();
		const result = Array.from(this.storage.keys());

		if (callback) {
			callback(null, result);
		}

		return Promise.resolve(result);
	}

	/**
	 * Flush all data
	 */
	flushall(callback?: RedisCallback<"OK">): Promise<"OK"> {
		this.storage.clear();

		if (callback) {
			callback(null, "OK");
		}

		return Promise.resolve("OK");
	}

	/**
	 * Remove all expired keys from storage
	 */
	private _removeExpiredKeys(): void {
		const now = Date.now();
		const expiredKeys: string[] = [];

		for (const [key, item] of this.storage.entries()) {
			if (item.expiry !== null && item.expiry <= now) {
				expiredKeys.push(key);
				this.storage.delete(key);
			}
		}

		if (this.debug && expiredKeys.length > 0) {
			console.log(
				`RedisMock: Removed ${expiredKeys.length} expired keys: ${expiredKeys.join(", ")}`,
			);
		}
	}

	/**
	 * Get the current state of the mock storage (for debugging)
	 */
	_getState(): Record<string, { value: string; expiry: string | null }> {
		const state: Record<string, { value: string; expiry: string | null }> = {};
		for (const [key, item] of this.storage.entries()) {
			state[key] = {
				value: item.value,
				expiry: item.expiry ? new Date(item.expiry).toISOString() : null,
			};
		}
		return state;
	}

	/**
	 * Get time to live for a key in seconds
	 */
	ttl(key: string, callback?: RedisCallback<number>): Promise<number> {
		this._removeExpiredKeys();
		const item = this.storage.get(key);

		let result = -2; // -2: key does not exist

		if (item) {
			if (item.expiry === null) {
				result = -1; // -1: key exists but has no associated expire
			} else {
				// Calculate remaining time in seconds
				result = Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
			}
		}

		if (this.debug) {
			console.log(`RedisMock: TTL ${key} => ${result}`);
		}

		if (callback) {
			callback(null, result);
		}

		return Promise.resolve(result);
	}
}

// Export a singleton instance
export const redisMock = new RedisMock();
