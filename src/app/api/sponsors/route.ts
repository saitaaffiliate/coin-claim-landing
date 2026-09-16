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

function isLoopbackOrPrivate(ip: string): boolean {
  const v = ip.replace(/^::ffff:/, "");
  if (v === "::1" || v === "127.0.0.1" || v === "0.0.0.0") return true;
  if (v.startsWith("10.") || v.startsWith("192.168.") || v.startsWith("169.254."))
    return true;
  const m = /^172\.(\d+)\./.exec(v);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

function headerIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return null;
}

async function resolveVisitorIp(req: NextRequest): string {
  const fromHeader = headerIp(req);
  if (fromHeader && !isLoopbackOrPrivate(fromHeader)) return fromHeader;

  // Localhost / private: OfferTrk needs a real public IP
  try {
    const r = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json()) as { ip?: string };
      if (j.ip) return j.ip;
    }
  } catch {
    // fall through
  }

  return fromHeader || "8.8.8.8";
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OFFERTRK_API_KEY?.trim();
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
  // Match OfferTrk guide: ctype=1 (CPI) by default
  const ctype = searchParams.get("ctype") ?? "1";
  const aff_sub4 = searchParams.get("aff_sub4");
  const aff_sub5 = searchParams.get("aff_sub5");

  const ip =
    searchParams.get("ip")?.trim() || (await resolveVisitorIp(req));
  const userAgent =
    searchParams.get("user_agent")?.trim() ||
    req.headers.get("user-agent") ||
    "Mozilla/5.0";

  // Upstream:
  // GET https://offertrk.org/api/v2?ip=...&user_agent=...&ctype=1
  // Header: Authorization: Bearer <OFFERTRK_API_KEY>
  const upstream = new URL(OFFERTRK_URL);
  upstream.searchParams.set("ip", ip);
  upstream.searchParams.set("user_agent", userAgent);
  upstream.searchParams.set("ctype", ctype);
  upstream.searchParams.set("max", max);
  if (min) upstream.searchParams.set("min", min);
  if (aff_sub4) upstream.searchParams.set("aff_sub4", aff_sub4);
  if (aff_sub5) upstream.searchParams.set("aff_sub5", aff_sub5);

  try {
    const res = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await res.text();
    let data: {
      success?: boolean;
      error?: string | null;
      offers?: Array<Record<string, unknown>>;
      message?: string;
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

    if (res.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message:
            "OfferTrk rejected the request — check Authorization Bearer token.",
          offers: [],
        },
        { status: 401 },
      );
    }

    if (!res.ok || data.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: data.error ?? "upstream_error",
          message:
            typeof data.message === "string"
              ? data.message
              : "Could not load sponsor apps right now.",
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
