import { NextRequest, NextResponse } from "next/server";

const OFFERTRK_URL =
  process.env.OFFERTRK_API_URL?.replace(/\/$/, "") ||
  "https://offertrk.org/api/v2";

export type SponsorOffer = {
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

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  // Local / unknown — OfferTrk requires an IP string
  return "127.0.0.1";
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OFFERTRK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "missing_api_key",
        message: "OFFERTRK_API_KEY is not configured on the server.",
        offers: [],
      },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const max = searchParams.get("max") ?? "12";
  const min = searchParams.get("min");
  const ctype = searchParams.get("ctype");
  const aff_sub4 = searchParams.get("aff_sub4");
  const aff_sub5 = searchParams.get("aff_sub5");

  const ip = searchParams.get("ip")?.trim() || clientIp(req);
  const userAgent =
    searchParams.get("user_agent")?.trim() ||
    req.headers.get("user-agent") ||
    "Mozilla/5.0";

  const upstream = new URL(OFFERTRK_URL);
  upstream.searchParams.set("ip", ip);
  upstream.searchParams.set("user_agent", userAgent);
  upstream.searchParams.set("max", max);
  if (min) upstream.searchParams.set("min", min);
  if (ctype) upstream.searchParams.set("ctype", ctype);
  if (aff_sub4) upstream.searchParams.set("aff_sub4", aff_sub4);
  if (aff_sub5) upstream.searchParams.set("aff_sub5", aff_sub5);

  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      // Fresh offers per visitor
      cache: "no-store",
    });

    const raw = await res.text();
    let data: {
      success?: boolean;
      error?: string | null;
      offers?: Array<Record<string, unknown>>;
    } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_upstream",
          message: "Sponsor API returned a non-JSON response.",
          offers: [],
        },
        { status: 502 },
      );
    }

    if (!res.ok || data.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: data.error ?? "upstream_error",
          message: "Could not load sponsor apps right now.",
          offers: [],
        },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const offers: SponsorOffer[] = (data.offers ?? []).map((o) => ({
      offerid: Number(o.offerid),
      name: String(o.name ?? ""),
      name_short: String(o.name_short ?? o.name ?? "Offer"),
      description: String(o.description ?? ""),
      adcopy: String(o.adcopy ?? ""),
      picture: String(o.picture ?? ""),
      country: String(o.country ?? ""),
      device: String(o.device ?? ""),
      link: String(o.link ?? ""),
      ctype: String(o.ctype ?? ""),
      boosted: Boolean(o.boosted),
    }));

    return NextResponse.json({ success: true, offers });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "network_error",
        message: "Failed to reach the sponsor API.",
        offers: [],
      },
      { status: 502 },
    );
  }
}
