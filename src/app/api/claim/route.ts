import { NextRequest, NextResponse } from "next/server";
import { GAME_SERVER_URL, USE_STUB } from "@/lib/config";
import { claimCoins } from "@/lib/mock-store";

/**
 * POST /api/claim
 * Body: { "userId": "player1" }
 * Marks coins as claimed and returns the result.
 *
 * When GAME_SERVER_URL is set, forwards to that server instead of the mock.
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const userId = body.userId?.trim() ?? "";
  if (!userId) {
    return NextResponse.json(
      { error: "missing_user_id", message: "Provide a user ID or username." },
      { status: 400 },
    );
  }

  if (!USE_STUB && GAME_SERVER_URL) {
    try {
      const res = await fetch(`${GAME_SERVER_URL}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
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

  const result = claimCoins(userId);

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      not_found: "No account found for that user ID.",
      already_claimed: "These coins have already been claimed.",
      nothing_to_claim: "There are no coins left to claim.",
    };
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "already_claimed"
          ? 409
          : 400;

    return NextResponse.json(
      {
        error: result.reason,
        message: messages[result.reason],
        userId,
      },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    userId: result.user.userId,
    displayName: result.user.displayName,
    claimed: result.claimed,
    status: result.user.status,
    message: `Successfully claimed ${result.claimed.toLocaleString()} coins!`,
  });
}
