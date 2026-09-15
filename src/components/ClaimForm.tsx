"use client";

import { FormEvent, useState } from "react";
import { API_BASE } from "@/lib/config";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
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

export default function ClaimForm() {
  const [userId, setUserId] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [claiming, setClaiming] = useState(false);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    const id = userId.trim();
    if (!id) return;

    setState({ kind: "loading" });

    try {
      const res = await fetch(
        `${API_BASE}/api/lookup?userId=${encodeURIComponent(id)}`,
      );
      const data = await res.json();

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
    } catch {
      setState({
        kind: "error",
        code: "generic",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  async function handleClaim() {
    if (state.kind !== "ready") return;
    setClaiming(true);

    try {
      const res = await fetch(`${API_BASE}/api/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: state.userId }),
      });
      const data = await res.json();

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
        displayName: data.displayName ?? state.displayName,
      });
    } catch {
      setState({
        kind: "error",
        code: "generic",
        message: "Network error during claim. Please try again.",
      });
    } finally {
      setClaiming(false);
    }
  }

  function reset() {
    setState({ kind: "idle" });
    setUserId("");
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-gold/25 bg-surface/80 backdrop-blur-md shadow-glow p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gold-bright tracking-wide text-center mb-1">
          Claim Your Coins
        </h2>
        <p className="text-sm text-muted text-center mb-6">
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
                placeholder="e.g. player1"
                autoComplete="username"
                disabled={state.kind === "loading"}
                className="w-full rounded-xl border border-gold/20 bg-ink/60 px-4 py-3 text-foreground placeholder:text-muted/70 outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition"
              />
            </label>
            <button
              type="submit"
              disabled={state.kind === "loading" || !userId.trim()}
              className="w-full rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 py-3 font-semibold text-ink shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {state.kind === "loading" ? "Checking…" : "Check Rewards"}
            </button>
          </form>
        )}

        {state.kind === "error" && (
          <div
            role="alert"
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              state.code === "already_claimed"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : state.code === "not_found"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
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

        {state.kind === "ready" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gold/20 bg-ink/50 px-4 py-4 text-center">
              <p className="text-sm text-muted">Welcome back</p>
              <p className="text-lg font-semibold text-foreground mt-0.5">
                {state.displayName}
              </p>
              <p className="mt-3 text-4xl font-bold text-gold-bright tabular-nums tracking-tight">
                {state.coins.toLocaleString()}
              </p>
              <p className="text-sm text-gold/80 mt-1">coins ready to claim</p>
            </div>
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="w-full rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 py-3.5 font-semibold text-ink shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {claiming ? "Claiming…" : "Claim Coins"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full text-sm text-muted hover:text-foreground transition"
            >
              Use a different ID
            </button>
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
      </div>
    </div>
  );
}
