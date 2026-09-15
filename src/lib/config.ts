/**
 * Brand & API configuration
 * -------------------------
 * Edit BRAND_NAME to rebrand this landing page.
 * Point API_BASE / GAME_SERVER_URL at your real game server when ready.
 *
 * Stub mode (default): Next.js API routes under /api/* use an in-memory mock.
 * Production: set GAME_SERVER_URL (or NEXT_PUBLIC_API_BASE) to your game API
 * and update the client fetch URLs / server proxy accordingly.
 */

export const BRAND_NAME = "Rewards";

/** Public site title / meta */
export const SITE_TAGLINE = "Claim your earned coins";

/**
 * Base URL for claim/lookup calls from the browser.
 * Leave as "" to hit this Next.js app's own /api routes (stub).
 * Example for a real game server: "https://api.example-game.com"
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";

/**
 * Server-side game server URL (used by API routes when proxying).
 * When set, stub handlers can forward to this origin instead of the mock store.
 * Example: "https://game-api.internal:8080"
 */
export const GAME_SERVER_URL =
  process.env.GAME_SERVER_URL?.replace(/\/$/, "") ?? "";

export const USE_STUB = !GAME_SERVER_URL;

/**
 * OfferTrk sponsors API is server-only.
 * Set OFFERTRK_API_KEY (and optional OFFERTRK_API_URL) in `.env.local`.
 * The browser calls `/api/sponsors`; the key never ships to the client.
 */
