"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";

type SponsorOffer = {
  offerid: number;
  name: string;
  name_short: string;
  description: string;
  adcopy: string;
  picture: string;
  country: string;
  device: string;
  link: string;
  ctype: string;
  boosted: boolean;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; offers: SponsorOffer[] }
  | { kind: "error"; message: string };

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Sponsors() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });
      try {
        const res = await fetch(`${API_BASE}/api/sponsors?max=12&ctype=1`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setState({
            kind: "error",
            message: data.message ?? "Could not load sponsor apps.",
          });
          return;
        }
        setState({ kind: "ready", offers: data.offers ?? [] });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Network error while loading sponsor apps.",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="sponsors"
      className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 className="text-center text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
        Featured apps & offers
      </h2>
      <p className="mt-2 text-center text-muted text-sm sm:text-base max-w-lg mx-auto">
        Complete an offer below to unlock more ways to earn. Personalized for
        your device and location.
      </p>

      {state.kind === "loading" && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-gold/10 bg-surface/40"
            />
          ))}
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          className="mt-10 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-5 text-center text-sm text-rose-200"
        >
          {state.message}
        </div>
      )}

      {state.kind === "ready" && state.offers.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">
          No sponsor apps available for you right now. Check back soon.
        </p>
      )}

      {state.kind === "ready" && state.offers.length > 0 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.offers.map((offer) => {
            const blurb =
              offer.adcopy ||
              stripHtml(offer.description).slice(0, 140) ||
              offer.name_short;
            return (
              <li
                key={offer.offerid}
                className="flex flex-col rounded-2xl border border-gold/15 bg-surface/60 p-4 sm:p-5 shadow-sm hover:border-gold/35 transition"
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.picture}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover bg-ink/40 border border-gold/15"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-2">
                        {offer.name_short || offer.name}
                      </h3>
                      {offer.boosted && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-bright border border-gold/30">
                          Hot
                        </span>
                      )}
                    </div>
                    {offer.ctype && (
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
                        {offer.ctype}
                        {offer.country ? ` · ${offer.country}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm text-muted leading-relaxed line-clamp-3">
                  {blurb}
                </p>
                <a
                  href={offer.link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 py-2.5 text-sm font-semibold text-ink shadow-md hover:brightness-110 transition"
                >
                  Get reward
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
