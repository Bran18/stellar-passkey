/**
 * Client-side helper for debugging Redis in development mode
 */

const REDIS_DEBUG_BASE_URL = "/api/redis-debug";

export type RedisDebugResponse = {
	message?: string;
	error?: string;
	usingMock?: boolean;
	totalKeys?: number;
	state?: Record<string, { value: string; expiry: string | null }>;
	exists?: boolean;
	value?: string | null;
	ttl?: number;
	ttlHuman?: string;
};

// Helper to safely execute API calls
const safeApiFetch = async (url: string): Promise<RedisDebugResponse> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`API responded with status: ${response.status}`);
		}
		return (await response.json()) as RedisDebugResponse;
	} catch (error) {
		console.error(`Error fetching from ${url}:`, error);
		return {
			error: error instanceof Error ? error.message : String(error),
			message: "Failed to fetch data from API",
		};
	}
};

export const RedisDebug = {
	/**
	 * Get the current state of Redis mock
	 */
	async getState(): Promise<RedisDebugResponse> {
		if (
			typeof window === "undefined" ||
			process.env.NODE_ENV !== "development"
		) {
			console.warn(
				"Redis debug helper only works in client-side development mode",
			);
			return { message: "Not available in this environment" };
		}

		return safeApiFetch(REDIS_DEBUG_BASE_URL);
	},

	/**
	 * Get information about a specific key
	 */
	async getKey(key: string): Promise<RedisDebugResponse> {
		if (
			typeof window === "undefined" ||
			process.env.NODE_ENV !== "development"
		) {
			console.warn(
				"Redis debug helper only works in client-side development mode",
			);
			return { message: "Not available in this environment" };
		}

		if (!key) {
			return { error: "No key provided" };
		}

		return safeApiFetch(
			`${REDIS_DEBUG_BASE_URL}?key=${encodeURIComponent(key)}`,
		);
	},

	/**
	 * Flush all Redis data
	 */
	async flushAll(): Promise<RedisDebugResponse> {
		if (
			typeof window === "undefined" ||
			process.env.NODE_ENV !== "development"
		) {
			console.warn(
				"Redis debug helper only works in client-side development mode",
			);
			return { message: "Not available in this environment" };
		}

		return safeApiFetch(`${REDIS_DEBUG_BASE_URL}?action=flush`);
	},

	/**
	 * Log Redis challenge keys to console
	 */
	async logChallengeKeys(): Promise<void> {
		if (
			typeof window === "undefined" ||
			process.env.NODE_ENV !== "development"
		) {
			console.warn(
				"Redis debug helper only works in client-side development mode",
			);
			return;
		}

		try {
			const state = await this.getState();
			console.group("Redis Challenge Keys");

			if (!state.state || Object.keys(state.state).length === 0) {
				console.log("No keys in Redis");
				console.groupEnd();
				return;
			}

			const challengeKeys = Object.keys(state.state).filter((key) =>
				key.startsWith("challenge:"),
			);

			if (challengeKeys.length === 0) {
				console.log("No challenge keys found");
			} else {
				console.log(`Found ${challengeKeys.length} challenge keys:`);
				for (const key of challengeKeys) {
					try {
						const keyInfo = await this.getKey(key);
						console.log(
							`${key}: ${keyInfo.ttlHuman || "unknown TTL"} - ${keyInfo.value || "no value"}`,
						);
					} catch (error) {
						console.error(`Error retrieving key ${key}:`, error);
					}
				}
			}

			console.groupEnd();
		} catch (error) {
			console.error("Error logging challenge keys:", error);
		}
	},
};
