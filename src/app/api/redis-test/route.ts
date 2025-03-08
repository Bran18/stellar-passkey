import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ENV } from "@/app/libs/env";
import { redisMock } from "@/app/libs/RedisMock";

const TEST_KEY = "redis_test:persistence_check";

/**
 * API endpoint to test Redis persistence across API calls
 * - GET: Retrieves the test value if it exists
 * - POST: Sets a new test value and returns it
 * - DELETE: Removes the test value
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
		// Get the current timestamp for logging
		const timestamp = new Date().toISOString();

		// Try to get the test value
		const value = await redisMock.get(TEST_KEY);

		return NextResponse.json({
			message: "Redis persistence test",
			success: true,
			timestamp,
			mockStorage: !!global.__redisMockStorage,
			mockStorageSize: global.__redisMockStorage?.size || 0,
			value,
			exists: value !== null,
		});
	} catch (error) {
		console.error("Error testing Redis:", error);
		return NextResponse.json(
			{
				error: "Failed to test Redis",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
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
		// Generate a test value with the current timestamp
		const timestamp = new Date().toISOString();
		const testValue = `Redis test value set at ${timestamp}`;

		// Set the test value with a 5-minute expiry
		await redisMock.set(TEST_KEY, testValue, "EX", 300);

		return NextResponse.json({
			message: "Redis test value set",
			success: true,
			timestamp,
			value: testValue,
			mockStorage: !!global.__redisMockStorage,
			mockStorageSize: global.__redisMockStorage?.size || 0,
		});
	} catch (error) {
		console.error("Error setting Redis test value:", error);
		return NextResponse.json(
			{
				error: "Failed to set Redis test value",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
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
		await redisMock.del(TEST_KEY);

		return NextResponse.json({
			message: "Redis test value deleted",
			success: true,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error deleting Redis test value:", error);
		return NextResponse.json(
			{
				error: "Failed to delete Redis test value",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
