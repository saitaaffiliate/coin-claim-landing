/**
 * In-memory mock store for the stub API.
 * Replace with calls to GAME_SERVER_URL when wiring a real game server.
 *
 * Sample user IDs to try on the landing page:
 *   player1, player2, demo, vip_user
 */

export type ClaimStatus = "available" | "claimed";

export interface MockUser {
  userId: string;
  displayName: string;
  coins: number;
  status: ClaimStatus;
}

const initialUsers: MockUser[] = [
  {
    userId: "player1",
    displayName: "Player One",
    coins: 1500,
    status: "available",
  },
  {
    userId: "player2",
    displayName: "Player Two",
    coins: 750,
    status: "available",
  },
  {
    userId: "demo",
    displayName: "Demo Account",
    coins: 2500,
    status: "available",
  },
  {
    userId: "vip_user",
    displayName: "VIP User",
    coins: 10000,
    status: "available",
  },
];

/** Module-level map so claim state persists across requests in the same process */
const users = new Map<string, MockUser>(
  initialUsers.map((u) => [u.userId.toLowerCase(), { ...u }]),
);

export function normalizeUserId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function getUser(userId: string): MockUser | undefined {
  return users.get(normalizeUserId(userId));
}

export function claimCoins(
  userId: string,
):
  | { ok: true; user: MockUser; claimed: number }
  | { ok: false; reason: "not_found" | "already_claimed" | "nothing_to_claim" } {
  const key = normalizeUserId(userId);
  const user = users.get(key);

  if (!user) {
    return { ok: false, reason: "not_found" };
  }
  if (user.status === "claimed") {
    return { ok: false, reason: "already_claimed" };
  }
  if (user.coins <= 0) {
    return { ok: false, reason: "nothing_to_claim" };
  }

  const claimed = user.coins;
  user.status = "claimed";
  user.coins = 0;
  users.set(key, user);

  return { ok: true, user: { ...user }, claimed };
}

export function listMockUserIds(): string[] {
  return [...users.keys()];
}
