import { type NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
	try {
		const input = {
			origin: req.headers.get("origin"),
			headers: req.headers,
		};
		console.log("Getting config", input);
		return NextResponse.json(input);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to get config" },
			{ status: 500 },
		);
	}
}
