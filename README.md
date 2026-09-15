# Coin Claim Landing

Neutral rewards landing page for looking up a user ID and claiming in-game coins. Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Ships with stub API routes and mock users so you can demo the full flow locally.

Brand copy is driven by a single constant (`BRAND_NAME` in `src/lib/config.ts`) — default is `"Rewards"`.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve the production build
```

## Mock user IDs

Use these on the claim form (case-insensitive):

| User ID    | Coins  | Notes              |
|------------|--------|--------------------|
| `player1`  | 1,500  | Standard sample    |
| `player2`  | 750    | Standard sample    |
| `demo`     | 2,500  | Demo account       |
| `vip_user` | 10,000 | Higher balance     |

Unknown IDs return **not found**. After a successful claim, the same ID returns **already claimed** until the server process restarts (in-memory store).

## Stub API

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/lookup?userId=player1` | Lookup claimable coins |
| `POST` | `/api/claim` body `{ "userId": "player1" }` | Mark coins claimed |

Mock data lives in `src/lib/mock-store.ts`.

## Pointing at a real game server

1. **Config** — `src/lib/config.ts`
   - `BRAND_NAME` — rebrand the UI
   - `API_BASE` / `NEXT_PUBLIC_API_BASE` — browser fetch prefix (leave empty to use this app’s `/api`)
   - `GAME_SERVER_URL` — server-side upstream; when set, the stub routes forward lookup/claim there

2. **Environment** (optional)

   ```bash
   # .env.local
   GAME_SERVER_URL=https://your-game-api.example.com
   # NEXT_PUBLIC_API_BASE=   # only if the browser should call another origin directly
   ```

3. **Expected upstream shape** (what the stub currently returns / proxies):
   - Lookup `200`: `{ userId, displayName, coins, status: "available"|"claimed", claimable }`
   - Lookup `404`: `{ error: "not_found", message }`
   - Claim `200`: `{ success: true, userId, displayName, claimed, status, message }`
   - Claim `409`: `{ error: "already_claimed", message }`

Replace or thin the handlers in `src/app/api/lookup/route.ts` and `src/app/api/claim/route.ts` once your game API contract is final.

## Project layout

```
src/
  app/
    page.tsx              # Landing page
    layout.tsx
    globals.css           # Dark / gold theme tokens
    api/lookup/route.ts   # GET lookup stub
    api/claim/route.ts    # POST claim stub
  components/
    ClaimForm.tsx         # Client claim UI + states
    Header.tsx
    Footer.tsx
    HowItWorks.tsx
  lib/
    config.ts             # Brand + API base / GAME_SERVER_URL
    mock-store.ts         # In-memory sample users
```

## License

Private / unlicensed unless you add one.
