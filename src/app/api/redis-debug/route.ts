import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ENV } from "@/app/libs/env";
import { redisMock } from "@/app/libs/RedisMock";

/**
 * Debug API for Redis mock state
 * Supports actions:
 * - GET /api/redis-debug - Get current state
 * - GET /api/redis-debug?action=flush - Flush all data
 * - GET /api/redis-debug?key=X - Get details about a specific key
 */
export async function GET(request: NextRequest) {
	// Security check to ensure this only runs in development
	if (ENV.ENV !== "development") {
		return NextResponse.json(
			{
				error: "Debug endpoints are only available in development mode",
			},
			{ status: 403 },
		);
	}

	try {
		const url = new URL(request.url);
		const action = url.searchParams.get("action");
		const key = url.searchParams.get("key");

		// Handle action=flush
		if (action === "flush") {
			await redisMock.flushall();
			return NextResponse.json({
				message: "Redis mock flushed successfully",
				usingMock: !ENV.REDIS_URL,
			});
		}

		// Handle specific key lookup
		if (key) {
			const value = await redisMock.get(key);
			const ttl = await redisMock.ttl(key);

			return NextResponse.json({
				message: `Redis key: ${key}`,
				exists: value !== null,
				value: value,
				ttl: ttl,
				ttlHuman:
					ttl === -2
						? "Key does not exist"
						: ttl === -1
							? "No expiry"
							: `${ttl}s remaining`,
			});
		}

		// Return the current state of the Redis mock
		const state = redisMock._getState();

		return NextResponse.json({
			message: "Redis mock state",
			usingMock: !ENV.REDIS_URL,
			totalKeys: Object.keys(state).length,
			state,
		});
	} catch (error) {
		console.error("Error accessing Redis mock state:", error);
		return NextResponse.json(
			{
				error: "Failed to access Redis mock state",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
