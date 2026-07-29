# bobprod — web app

Real Stage 1 implementation of the bobprod site: Vite + React 19 + TypeScript + React Router 7 +
Tailwind v4 on the frontend, Express 5 + SQLite (Node's built-in `node:sqlite`) on the backend.

Design system: near-black `#0a0a0a`, red `#d1382a` / gold `#f0a91f`, Righteous (display) +
Poppins (body), glass panels — same direction as the static prototypes in `../project/`.

## Setup

```bash
cp server/.env.example server/.env   # then edit JWT_SECRET / ADMIN_PASSWORD
npm install
npm run dev:all                      # Vite on :5173, Express on :3001 (proxied via /api, /uploads)
```

Or run them separately: `npm run dev` (frontend) and `npm run server` (backend).

The admin account is seeded on first boot from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in
`server/.env`. Log in at `/admin`.

## Structure

```
src/
  components/       Layout, Header, Footer, Hero, ParticleField, ErrorBoundary, admin/
  pages/            Home, Music, Bio, Events, Links, Contact, Privacy, NotFound, admin/*
  lib/              api client, publicConfig context, useAdminAuth, types
server/
  db.ts             node:sqlite setup + schema + admin seeding
  repositories.ts   typed CRUD for tracks/events/bookings/biolinks/theme
  auth.ts           bcrypt + JWT cookie session, requireAdmin middleware
  index.ts          Express app + all routes
```

## Notes / deviations from the original brief

- **`node:sqlite` instead of `better-sqlite3`**: this environment can't compile
  `better-sqlite3`'s native addon (no network access to fetch Node headers). Node 22 ships a
  built-in synchronous SQLite module with a very similar `prepare/run/get/all` API, so it was
  swapped in with no schema or behavior change. If you deploy somewhere `better-sqlite3` compiles
  fine, swapping back is a small, isolated change confined to `server/db.ts` and
  `server/repositories.ts`.
- **Fonts are self-hosted** via `@fontsource/righteous` and `@fontsource/poppins` instead of the
  Google Fonts CDN `<link>` — one less external dependency/render-blocking request in production,
  and it sidesteps this sandbox's network policy for `fonts.googleapis.com`.
- **Reorder UI uses up/down buttons**, not drag-and-drop, for tracks/links — simpler and fully
  accessible; can be upgraded to drag-and-drop later without changing the API.
- Hero background uses a 2D canvas particle field (ported from the static `project/website`
  prototype) instead of the brief's Three.js version, to keep the dependency footprint small for
  this first pass.
- Not yet implemented (deferred per the brief): file uploads wired into the Tracks/Events forms
  (the `/api/admin/uploads` endpoint exists but isn't called from the UI yet), rate limiting is on
  login/bookings only (no chat endpoint exists yet), and all Stage 2/3 items (BYOK LLM assistant,
  Meta/TikTok conversions, content blocks) from `../docs/architecture/` are not started.

## Verified

- `npx tsc -b --noEmit` clean.
- Full click-through (headless Chromium): home → music → events → links → contact form submit →
  404 → admin login → add track → bookings list shows the submission → logout.
- Restarted the server process mid-session and confirmed data persisted (proves SQLite writes,
  not in-memory state).
