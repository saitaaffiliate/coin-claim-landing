/**
 * Robux Rewards — static claim landing
 * Lookup/claim state lives in localStorage (works offline).
 * Sponsor offers are fetched live from OfferTrk in the browser.
 *
 * SECURITY: OFFERTRK_API_KEY is visible to anyone who views this file.
 */
const CONFIG = {
  OFFERTRK_API_KEY:
    "47895|BU5Qh9a4sdd2mO4kgWstNtHeE08PuTD8T9BZ6LHWcba12b2b",
  OFFERTRK_API_URL: "https://offertrk.org/api/v2",
  STORAGE_KEY: "robux_claim_users_v1",
  DEFAULT_COINS: 1500,
  STAGED_DELAY_MS: 7500,
  IPIFY_URL: "https://api.ipify.org?format=json",
  FALLBACK_IP: "8.8.8.8",
};

const LOOKUP_MESSAGES = [
  "Connecting to the server…",
  "Fetching your account…",
  "Looking up rewards…",
  "Verifying your profile…",
  "Almost ready…",
];

const VERIFY_MESSAGES = [
  "We are verifying your account…",
  "Checking your username…",
  "Confirming eligibility…",
  "Almost done verifying…",
];

const ERROR_TITLES = {
  already_claimed: "Already claimed",
  not_found: "Not found",
  missing_username: "Username needed",
  generic: "Error",
};

/* -------------------------------------------------------------------------- */
/* Store (localStorage)                                                       */
/* -------------------------------------------------------------------------- */

function normalizeUserId(raw) {
  return String(raw || "").trim().toLowerCase();
}

function titleCaseDisplayName(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "Player";
  return trimmed
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* private mode / quota */
  }
}

function getOrCreateUser(userId) {
  const users = loadUsers();
  const key = normalizeUserId(userId);
  const existing = users[key];
  if (existing) return existing;

  const created = {
    userId: String(userId).trim(),
    displayName: titleCaseDisplayName(userId),
    coins: CONFIG.DEFAULT_COINS,
    status: "available",
  };
  users[key] = created;
  saveUsers(users);
  return created;
}

/* -------------------------------------------------------------------------- */
/* DOM                                                                        */
/* -------------------------------------------------------------------------- */

const els = {
  year: document.getElementById("year"),
  card: document.getElementById("claim-card"),
  form: document.getElementById("lookup-form"),
  input: document.getElementById("username-input"),
  submit: document.getElementById("lookup-submit"),
  loading: document.getElementById("loading-panel"),
  loadingMsg: document.getElementById("loading-message"),
  error: document.getElementById("error-panel"),
  errorTitle: document.getElementById("error-title"),
  errorMsg: document.getElementById("error-message"),
  ready: document.getElementById("ready-panel"),
  verifyMsg: document.getElementById("verify-message"),
  reset: document.getElementById("reset-btn"),
  sponsorsSection: document.getElementById("sponsors-section"),
  sponsorsBody: document.getElementById("sponsors-body"),
};

if (els.year) {
  els.year.textContent = String(new Date().getFullYear());
}

/* -------------------------------------------------------------------------- */
/* UI state                                                                   */
/* -------------------------------------------------------------------------- */

/** @typedef {{ kind: string, [k: string]: any }} UiState */

/** @type {UiState} */
let state = { kind: "idle" };
let lookupGen = 0;
let verifyTimer = 0;
let verifyIndex = 0;
let sponsorsAbort = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStagedWait(messages, onMessage, totalMs) {
  const step = Math.max(800, Math.floor(totalMs / messages.length));
  const started = Date.now();
  for (let i = 0; i < messages.length; i++) {
    onMessage(messages[i]);
    const elapsed = Date.now() - started;
    const target = (i + 1) * step;
    const wait = Math.max(0, Math.min(step, target - elapsed));
    if (i < messages.length - 1 || wait > 0) {
      await sleep(
        i === messages.length - 1 ? Math.max(0, totalMs - elapsed) : wait
      );
    }
  }
  const leftover = totalMs - (Date.now() - started);
  if (leftover > 0) await sleep(leftover);
}

function stopVerifyCycle() {
  if (verifyTimer) {
    window.clearInterval(verifyTimer);
    verifyTimer = 0;
  }
}

function startVerifyCycle() {
  stopVerifyCycle();
  verifyIndex = 0;
  if (els.verifyMsg) els.verifyMsg.textContent = VERIFY_MESSAGES[0];
  verifyTimer = window.setInterval(() => {
    verifyIndex = (verifyIndex + 1) % VERIFY_MESSAGES.length;
    if (els.verifyMsg) {
      els.verifyMsg.textContent = VERIFY_MESSAGES[verifyIndex];
    }
  }, 2200);
}

function render() {
  const kind = state.kind;
  const showForm = kind === "idle" || kind === "loading" || kind === "error";
  const showSponsors = kind === "ready";

  els.form.hidden = !showForm;
  els.input.disabled = kind === "loading";
  els.submit.disabled = kind === "loading";
  els.submit.textContent = kind === "loading" ? "Please wait…" : "Check Rewards";

  els.loading.hidden = kind !== "loading";
  if (kind === "loading") {
    els.loadingMsg.textContent = state.message || LOOKUP_MESSAGES[0];
  }

  els.error.hidden = kind !== "error";
  if (kind === "error") {
    const code = state.code || "generic";
    const amber = code === "already_claimed" || code === "missing_username";
    els.error.classList.toggle("is-amber", amber);
    els.errorTitle.textContent = ERROR_TITLES[code] || ERROR_TITLES.generic;
    els.errorMsg.textContent = state.message || "Something went wrong. Try again.";
  }

  els.ready.hidden = kind !== "ready";
  els.sponsorsSection.hidden = !showSponsors;
  els.card.classList.toggle("claim-card--wide", showSponsors);

  if (kind === "ready") {
    if (!verifyTimer) startVerifyCycle();
  } else {
    stopVerifyCycle();
  }
}

function setState(next) {
  state = next;
  render();
}

function resetForm() {
  lookupGen += 1;
  if (sponsorsAbort) {
    try {
      sponsorsAbort.abort();
    } catch {
      /* ignore */
    }
    sponsorsAbort = null;
  }
  els.input.value = "";
  els.sponsorsBody.innerHTML = "";
  setState({ kind: "idle" });
  els.input.focus();
}

/* -------------------------------------------------------------------------- */
/* Lookup                                                                     */
/* -------------------------------------------------------------------------- */

els.input.addEventListener("input", () => {
  if (state.kind === "error" && state.code === "missing_username") {
    setState({ kind: "idle" });
  }
});

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = els.input.value.trim();
  if (!id) {
    setState({
      kind: "error",
      code: "missing_username",
      message: "Write the username first.",
    });
    return;
  }

  const gen = ++lookupGen;
  setState({ kind: "loading", message: LOOKUP_MESSAGES[0] });

  // Resolve user immediately (localStorage), but wait the staged delay
  // before revealing the result — matches the original ~7.5s lookup.
  let user = null;
  let storeError = null;
  try {
    user = getOrCreateUser(id);
  } catch (err) {
    storeError = err;
  }

  await runStagedWait(
    LOOKUP_MESSAGES,
    (message) => {
      if (gen !== lookupGen) return;
      setState({ kind: "loading", message });
    },
    CONFIG.STAGED_DELAY_MS
  );

  if (gen !== lookupGen) return;

  if (storeError || !user) {
    setState({
      kind: "error",
      code: "generic",
      message: "Something went wrong. Try again.",
    });
    return;
  }

  if (user.status === "claimed" || !(user.status === "available" && user.coins > 0)) {
    setState({
      kind: "error",
      code: "already_claimed",
      message: "These coins have already been claimed for this account.",
    });
    return;
  }

  setState({
    kind: "ready",
    userId: user.userId,
    displayName: user.displayName,
    coins: user.coins,
    claimable: true,
    status: user.status,
  });
  loadSponsors();
});

els.reset.addEventListener("click", resetForm);

/* -------------------------------------------------------------------------- */
/* Sponsors / OfferTrk                                                        */
/* -------------------------------------------------------------------------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(url) {
  try {
    const u = new URL(String(url), window.location.href);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    /* ignore */
  }
  return "";
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderSponsorSkeletons() {
  const items = Array.from({ length: 4 }, () => `<div class="offer-skel"></div>`).join("");
  els.sponsorsBody.innerHTML = `<div class="offers-grid">${items}</div>`;
}

function renderSponsorError(message) {
  els.sponsorsBody.innerHTML = `<div class="sponsors-error" role="alert">${escapeHtml(
    message
  )}</div>`;
}

function renderSponsorEmpty() {
  els.sponsorsBody.innerHTML = `<p class="sponsors-empty">No sponsor apps available for you right now. Check back soon.</p>`;
}

function mapOffer(raw, index) {
  const o = raw && typeof raw === "object" ? raw : {};
  return {
    offerid: Number(o.offerid) || index,
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
  };
}

function renderOffers(offers) {
  const html = offers
    .map((offer) => {
      const blurb =
        offer.adcopy ||
        stripHtml(offer.description).slice(0, 140) ||
        offer.name_short;
      const title = offer.name_short || offer.name || "Offer";
      const href = safeHttpUrl(offer.link);
      const pic = safeHttpUrl(offer.picture);
      const ctypeLine = offer.ctype
        ? `${offer.ctype}${offer.country ? ` · ${offer.country}` : ""}`
        : "";
      const hot = offer.boosted
        ? `<span class="offer-hot">Hot</span>`
        : "";
      const img = pic
        ? `<img class="offer-art" src="${escapeHtml(pic)}" alt="" width="56" height="56" loading="lazy" />`
        : `<div class="offer-art" aria-hidden="true"></div>`;
      const cta = href
        ? `<a class="btn-gold offer-cta" href="${escapeHtml(
            href
          )}" target="_blank" rel="noopener noreferrer sponsored">Get reward</a>`
        : `<span class="btn-gold offer-cta" style="opacity:0.5;pointer-events:none">Get reward</span>`;

      return `<li class="offer-card">
        <div class="offer-top">
          ${img}
          <div class="offer-meta">
            <div class="offer-name-row">
              <h3 class="offer-name line-clamp-2">${escapeHtml(title)}</h3>
              ${hot}
            </div>
            ${
              ctypeLine
                ? `<p class="offer-ctype">${escapeHtml(ctypeLine)}</p>`
                : ""
            }
          </div>
        </div>
        <p class="offer-blurb line-clamp-3">${escapeHtml(blurb)}</p>
        ${cta}
      </li>`;
    })
    .join("");

  els.sponsorsBody.innerHTML = `<ul class="offers-grid">${html}</ul>`;
}

async function resolveVisitorIp() {
  try {
    const res = await fetch(CONFIG.IPIFY_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ip === "string" && data.ip.trim()) {
        return data.ip.trim();
      }
    }
  } catch {
    /* fall through */
  }
  return CONFIG.FALLBACK_IP;
}

function corsOrNetworkMessage() {
  return (
    "Could not load sponsor apps. The browser blocked the OfferTrk request " +
    "(this is often a CORS restriction when calling the API directly from a " +
    "static page). Offers need a live connection to offertrk.org — lookup " +
    "still works offline."
  );
}

async function loadSponsors() {
  renderSponsorSkeletons();

  if (sponsorsAbort) {
    try {
      sponsorsAbort.abort();
    } catch {
      /* ignore */
    }
  }
  const ac = new AbortController();
  sponsorsAbort = ac;

  try {
    const ip = await resolveVisitorIp();
    if (ac.signal.aborted) return;

    const url = new URL(CONFIG.OFFERTRK_API_URL);
    url.searchParams.set("ip", ip);
    url.searchParams.set("user_agent", navigator.userAgent || "Mozilla/5.0");
    url.searchParams.set("ctype", "1");
    url.searchParams.set("max", "12");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CONFIG.OFFERTRK_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ac.signal,
    });

    const raw = await res.text();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      renderSponsorError("Sponsor API returned a non-JSON response.");
      return;
    }

    if (res.status === 401) {
      renderSponsorError(
        "OfferTrk rejected the request — check Authorization Bearer token."
      );
      return;
    }

    if (!res.ok || data.success === false) {
      const msg =
        typeof data.message === "string" && data.message
          ? data.message
          : "Could not load sponsor apps right now.";
      renderSponsorError(msg);
      return;
    }

    const offers = Array.isArray(data.offers)
      ? data.offers.map(mapOffer)
      : [];

    if (offers.length === 0) {
      renderSponsorEmpty();
      return;
    }

    renderOffers(offers);
  } catch (err) {
    if (err && err.name === "AbortError") return;
    renderSponsorError(corsOrNetworkMessage());
  }
}

/* -------------------------------------------------------------------------- */
/* Init                                                                       */
/* -------------------------------------------------------------------------- */

render();
