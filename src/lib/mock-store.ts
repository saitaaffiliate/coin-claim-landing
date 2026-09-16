/**
 * In-memory store for the stub API.
 * Any username is accepted — first lookup creates the account.
 * Replace with calls to GAME_SERVER_URL when wiring a real game server.
 */

export type ClaimStatus = "available" | "claimed";

export interface MockUser {
  userId: string;
  displayName: string;
  coins: number;
  status: ClaimStatus;
}

/** Default reward granted to a newly seen username (stub only). */
export const DEFAULT_CLAIMABLE_COINS = 1500;

/** Module-level map so claim state persists across requests in the same process */
const users = new Map<string, MockUser>();

export function normalizeUserId(raw: string): string {
  return raw.trim().toLowerCase();
}

function titleCaseDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Player";
  return trimmed
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Look up a user, or create one with default claimable coins. */
export function getOrCreateUser(userId: string): MockUser {
  const key = normalizeUserId(userId);
  const existing = users.get(key);
  if (existing) return existing;

  const created: MockUser = {
    userId: userId.trim(),
    displayName: titleCaseDisplayName(userId),
    coins: DEFAULT_CLAIMABLE_COINS,
    status: "available",
  };
  users.set(key, created);
  return created;
}

export function getUser(userId: string): MockUser | undefined {
  return users.get(normalizeUserId(userId));
}

export function claimCoins(
  userId: string,
):
  | { ok: true; user: MockUser; claimed: number }
  | { ok: false; reason: "not_found" | "already_claimed" | "nothing_to_claim" } {
  // Accept any username: create on first claim if missing
  const user = getOrCreateUser(userId);
  const key = normalizeUserId(userId);

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
