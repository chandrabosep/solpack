import { NextResponse } from "next/server";

/**
 * Legacy path. The install/session endpoint is now `GET /api/install/session?session=<token>`.
 * Returning 410 instead of silently doing the wrong thing.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint moved. Use GET /api/install/session?session=<sessionToken>.",
    },
    { status: 410 },
  );
}
