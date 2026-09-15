import { NextRequest, NextResponse } from "next/server";
import { GAME_SERVER_URL, USE_STUB } from "@/lib/config";
import { getUser } from "@/lib/mock-store";

/**
 * GET /api/lookup?userId=player1
 * Returns claimable coins for a user.
 *
 * When GAME_SERVER_URL is set, forwards to that server instead of the mock.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim() ?? "";

  if (!userId) {
    return NextResponse.json(
      { error: "missing_user_id", message: "Provide a user ID or username." },
      { status: 400 },
    );
  }

  if (!USE_STUB && GAME_SERVER_URL) {
    try {
      const res = await fetch(
        `${GAME_SERVER_URL}/lookup?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          error: "upstream_unavailable",
          message: "Could not reach the game server.",
        },
        { status: 502 },
      );
    }
  }

  const user = getUser(userId);
  if (!user) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "No account found for that user ID.",
        userId,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    userId: user.userId,
    displayName: user.displayName,
    coins: user.coins,
    status: user.status,
    claimable: user.status === "available" && user.coins > 0,
  });
}
