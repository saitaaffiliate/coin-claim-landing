"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/config";
import Sponsors from "@/components/Sponsors";

type UiState =
  | { kind: "idle" }
  | { kind: "loading"; message: string }
  | {
      kind: "ready";
      userId: string;
      displayName: string;
      coins: number;
      claimable: boolean;
      status: string;
    }
  | { kind: "success"; claimed: number; displayName: string }
  | {
      kind: "error";
      code: "not_found" | "already_claimed" | "generic";
      message: string;
    };

const LOOKUP_MESSAGES = [
  "Connecting to the server…",
  "Fetching your account…",
  "Looking up rewards…",
  "Verifying your profile…",
  "Almost ready…",
];

const CLAIM_MESSAGES = [
  "Connecting to the game server…",
  "Preparing your coins…",
  "Processing claim…",
  "Securing your reward…",
  "Finalizing transfer…",
];

const VERIFY_MESSAGES = [
  "We are verifying your account…",
  "Checking your username…",
  "Confirming eligibility…",
  "Almost done verifying…",
];

/** Total staged wait in the 5–10s range before showing the result. */
const STAGED_DELAY_MS = 7500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStagedWait(
  messages: string[],
  onMessage: (msg: string) => void,
  totalMs: number = STAGED_DELAY_MS,
) {
  const step = Math.max(800, Math.floor(totalMs / messages.length));
  const started = Date.now();
  for (let i = 0; i < messages.length; i++) {
    onMessage(messages[i]);
    const elapsed = Date.now() - started;
    const target = (i + 1) * step;
    const wait = Math.max(0, Math.min(step, target - elapsed));
    if (i < messages.length - 1 || wait > 0) {
      await sleep(i === messages.length - 1 ? Math.max(0, totalMs - elapsed) : wait);
    }
  }
  const leftover = totalMs - (Date.now() - started);
  if (leftover > 0) await sleep(leftover);
}

export default function ClaimForm() {
  const [userId, setUserId] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState(CLAIM_MESSAGES[0]);
  const [verifyMessage, setVerifyMessage] = useState(VERIFY_MESSAGES[0]);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  // Cycle verifying copy while the ready step is showing
  useEffect(() => {
    if (state.kind !== "ready" || claiming) return;
    setVerifyMessage(VERIFY_MESSAGES[0]);
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % VERIFY_MESSAGES.length;
      setVerifyMessage(VERIFY_MESSAGES[i]);
    }, 2200);
    return () => window.clearInterval(id);
  }, [state.kind, claiming]);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    const id = userId.trim();
    if (!id) return;

    setState({ kind: "loading", message: LOOKUP_MESSAGES[0] });

    const fetchPromise = fetch(
      `${API_BASE}/api/lookup?userId=${encodeURIComponent(id)}`,
    )
      .then(async (res) => {
        const data = await res.json();
        return { res, data };
      })
      .catch(() => null);

    await runStagedWait(LOOKUP_MESSAGES, (message) => {
      if (!cancelled.current) setState({ kind: "loading", message });
    });

    const result = await fetchPromise;
    if (cancelled.current) return;

    if (!result) {
      setState({
        kind: "error",
        code: "generic",
        message: "Network error. Check your connection and try again.",
      });
      return;
    }

    const { res, data } = result;

    if (res.status === 404 || data.error === "not_found") {
      setState({
        kind: "error",
        code: "not_found",
        message: data.message ?? "No account found for that user ID.",
      });
      return;
    }

    if (!res.ok) {
      setState({
        kind: "error",
        code: "generic",
        message: data.message ?? "Something went wrong. Try again.",
      });
      return;
    }

    if (data.status === "claimed" || !data.claimable) {
      setState({
        kind: "error",
        code: "already_claimed",
        message:
          data.message ??
          "These coins have already been claimed for this account.",
      });
      return;
    }

    setState({
      kind: "ready",
      userId: data.userId,
      displayName: data.displayName,
      coins: data.coins,
      claimable: data.claimable,
      status: data.status,
    });
  }

  async function handleClaim() {
    if (state.kind !== "ready") return;
    setClaiming(true);
    setClaimMessage(CLAIM_MESSAGES[0]);

    const user = state.userId;
    const displayName = state.displayName;

    const fetchPromise = fetch(`${API_BASE}/api/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user }),
    })
      .then(async (res) => {
        const data = await res.json();
        return { res, data };
      })
      .catch(() => null);

    await runStagedWait(CLAIM_MESSAGES, (message) => {
      if (!cancelled.current) setClaimMessage(message);
    });

    const result = await fetchPromise;
    if (cancelled.current) {
      setClaiming(false);
      return;
    }

    try {
      if (!result) {
        setState({
          kind: "error",
          code: "generic",
          message: "Network error during claim. Please try again.",
        });
        return;
      }

      const { res, data } = result;

      if (res.status === 409 || data.error === "already_claimed") {
        setState({
          kind: "error",
          code: "already_claimed",
          message: data.message ?? "These coins have already been claimed.",
        });
        return;
      }

      if (res.status === 404 || data.error === "not_found") {
        setState({
          kind: "error",
          code: "not_found",
          message: data.message ?? "No account found for that user ID.",
        });
        return;
      }

      if (!res.ok || !data.success) {
        setState({
          kind: "error",
          code: "generic",
          message: data.message ?? "Claim failed. Please try again.",
        });
        return;
      }

      setState({
        kind: "success",
        claimed: data.claimed,
        displayName: data.displayName ?? displayName,
      });
    } finally {
      setClaiming(false);
    }
  }

  function reset() {
    setState({ kind: "idle" });
    setUserId("");
    setClaiming(false);
  }

  const showSponsors = state.kind === "ready";

  return (
    <div className="w-full mx-auto min-w-0 px-0">
      <div
        className={`w-full mx-auto rounded-2xl border border-gold/25 bg-surface/80 backdrop-blur-md shadow-glow p-4 sm:p-8 overflow-hidden transition-[max-width] ${
          showSponsors ? "max-w-5xl" : "max-w-md"
        }`}
      >
        <h2 className="text-lg sm:text-2xl font-semibold text-gold-bright tracking-wide text-center mb-1 break-words">
          Claim Your Coins
        </h2>
        <p className="text-xs sm:text-sm text-muted text-center mb-5 sm:mb-6 px-1">
          Enter your user ID or username to check rewards
        </p>

        {(state.kind === "idle" ||
          state.kind === "loading" ||
          state.kind === "error") && (
          <form onSubmit={handleLookup} className="space-y-4">
            <label className="block">
              <span className="sr-only">User ID</span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={state.kind === "loading"}
                className="w-full min-h-11 rounded-xl border border-gold/20 bg-ink/60 px-3 sm:px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted/70 outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition touch-manipulation"
              />
            </label>
            <button
              type="submit"
              disabled={state.kind === "loading" || !userId.trim()}
              className="w-full min-h-11 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 py-3 font-semibold text-ink shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
            >
              {state.kind === "loading" ? "Please wait…" : "Check Rewards"}
            </button>
          </form>
        )}

        {state.kind === "loading" && (
          <div
            className="mt-5 rounded-xl border border-gold/20 bg-ink/50 px-4 py-5 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold-bright" />
            <p className="text-sm font-medium text-gold-bright">{state.message}</p>
            <p className="mt-1 text-xs text-muted">
              This can take a few seconds — hang tight.
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div
            role="alert"
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              state.code === "already_claimed"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            <p className="font-medium">
              {state.code === "already_claimed"
                ? "Already claimed"
                : state.code === "not_found"
                  ? "Not found"
                  : "Error"}
            </p>
            <p className="mt-1 opacity-90">{state.message}</p>
          </div>
        )}

        {state.kind === "ready" && !claiming && (
          <div className="space-y-5">
            <div
              className="rounded-xl border border-gold/20 bg-ink/50 px-4 py-6 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold-bright" />
              <p className="text-sm font-medium text-gold-bright">
                {verifyMessage}
              </p>
              <p className="mt-1 text-xs text-muted">
                Please wait — this only takes a moment.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full text-sm text-muted hover:text-foreground transition"
            >
              Use a different username
            </button>
          </div>
        )}

        {claiming && (
          <div
            className="rounded-xl border border-gold/20 bg-ink/50 px-4 py-5 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold-bright" />
            <p className="text-sm font-medium text-gold-bright">{claimMessage}</p>
            <p className="mt-1 text-xs text-muted">
              Please wait while we finish your claim.
            </p>
          </div>
        )}

        {state.kind === "success" && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/40">
              <svg
                className="h-7 w-7 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-300">
                Claim successful!
              </p>
              <p className="mt-2 text-foreground">
                <span className="font-bold text-gold-bright tabular-nums">
                  {state.claimed.toLocaleString()}
                </span>{" "}
                coins credited to{" "}
                <span className="font-medium">{state.displayName}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-gold/30 px-4 py-3 text-sm font-medium text-gold-bright hover:bg-gold/10 transition"
            >
              Claim for another account
            </button>
          </div>
        )}

        {showSponsors && (
          <div className="mt-6 border-t border-gold/15 pt-6">
            <Sponsors embedded />
          </div>
        )}
      </div>
    </div>
  );
}
