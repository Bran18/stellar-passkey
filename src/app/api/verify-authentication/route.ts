import { type NextRequest, NextResponse } from "next/server";
import { verifyAuthentication } from "@/app/libs/passkey";
import { InAppError } from "@/app/libs/errors";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const input = {
		identifier: body.identifier,
		origin: req.headers.get("origin") || body.origin || "",
		authenticationResponse: body.authenticationResponse,
	};
	try {
		console.log("Verifying authentication", input);
		const options = await verifyAuthentication(input);
		return NextResponse.json(options);
	} catch (error) {
		console.error("Error verifying authentication", error);
		if (error instanceof InAppError) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json(
			{ error: "Failed to verify authentication" },
			{ status: 500 },
		);
	}
}
