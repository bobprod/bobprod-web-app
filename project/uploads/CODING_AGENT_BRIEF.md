# bobprod — coding agent implementation brief

Self-contained brief for implementing Stage 1 of the bobprod site. Written so a coding agent with no prior context on this project can execute it directly. Read this whole file before starting.

## Project overview

`bobprod` is a self-hosted (not Vercel — target is a Hostinger or Contabo VPS) full-stack site for a house/techno DJ and producer, built as a **template to duplicate per client** (not a shared multi-tenant SaaS — every artist gets their own deployment/database).

- **Frontend**: `Project/bobprod/src/` — Vite + React 19 + TypeScript + React Router 7 + Tailwind v4 + shadcn/ui + Lenis (smooth scroll) + GSAP/ScrollTrigger (reveal animations) + Three.js (particle hero) + react-helmet-async (per-route SEO)
- **Backend**: `Project/bobprod/server/` — Express 5 + better-sqlite3 (file-based DB, `server/data.sqlite`), JWT session cookies for a single admin account, bcrypt password hashing
- **Dev workflow**: `npm run dev` (Vite on :5174) + `npm run server` (Express on :3001, via `tsx watch --env-file=server/.env`) run side by side; Vite proxies `/api/*` to `:3001` (see `vite.config.ts`)
- **Brand**: near-black `#0a0a0a` base, red `#d1382a` primary accent, gold `#f0a91f` secondary accent, Righteous (display) + Poppins (body) fonts — see `src/index.css` for the exact CSS custom properties and the `.liquid-glass` / `.animate-fade-up` utility classes already defined there.

## Current file map (already built, do not redo)

```
Project/bobprod/
├── server/
│   ├── db.ts              — better-sqlite3 setup, admin table, settings table (seo/tracking/chatbot as JSON blobs)
│   ├── auth.ts             — JWT session cookie issue/verify, requireAdmin middleware
│   ├── index.ts            — Express app: /api/admin/login|logout|session, /api/admin/settings (+ /seo /tracking /chatbot sub-routes), /api/public-config, /api/chat
│   ├── .env                — JWT_SECRET (generated), ADMIN_PASSWORD, PORT=3001, NODE_ENV
│   └── .env.example
├── src/
│   ├── App.tsx              — BrowserRouter + Routes: / /music /bio /events /contact /admin /admin/settings, wrapped in HelmetProvider > PublicConfigProvider > ConsentProvider
│   ├── index.css            — Tailwind import, CSS vars (--bg/--fg/--site-muted/--accent-red/--accent-gold/--font-display/--font-body), .liquid-glass, @keyframes fade-up
│   ├── components/
│   │   ├── Layout.tsx        — Header + <Outlet/> + Footer + ConsentBanner + Tracking + ChatWidget, calls useLenis()
│   │   ├── Header.tsx, Footer.tsx, Logo.tsx
│   │   ├── Hero.tsx           — uses ParticleField (Three.js) by default, or BoomerangVideoBg if a videoSrc prop is passed
│   │   ├── ParticleField.tsx  — Three.js interactive particle field, red/gold shader
│   │   ├── BoomerangVideoBg.tsx — capture-then-ping-pong video loop (needs a real video asset, currently unused — no src provided anywhere)
│   │   ├── NowPlayingWidget.tsx, PlaylistPlayer.tsx (SoundCloud widget API wrapper)
│   │   ├── ConsentBanner.tsx, Tracking.tsx (GTM/FB/TikTok pixel injection, gated on consent + configured IDs)
│   │   ├── ChatWidget.tsx     (visitor chat, hits /api/chat, only renders if chatbotEnabled from public config)
│   │   └── SeoHead.tsx        (react-helmet-async wrapper reading per-route SEO from public config)
│   ├── pages/
│   │   ├── Home.tsx, Music.tsx, Bio.tsx, Events.tsx, Contact.tsx
│   │   └── admin/AdminLogin.tsx, AdminSettings.tsx
│   └── lib/
│       ├── publicConfig.tsx  — PublicConfigProvider/usePublicConfig, fetches GET /api/public-config once
│       ├── useConsent.ts     — ConsentProvider/useConsent (context, NOT per-component state — this was a real bug fixed once already, don't regress it)
│       ├── useAdminAuth.ts, useLenis.ts, useRevealAnimations.ts (GSAP ScrollTrigger.batch pattern), adminTypes.ts
```

**Known constraints to respect:**
- `tsconfig.json`/`tsconfig.app.json` use `paths` for the `@/*` alias **without** `baseUrl` — adding `baseUrl` back triggers a TS7 deprecation error. Don't add it.
- `react-router-dom` is pinned to the latest 7.x on purpose — a known `npm audit` advisory (GHSA-qwww-vcr4-c8h2) only affects unstable RSC framework mode, which this app never enables. Don't downgrade to "fix" it.
- `useConsent` **must** stay a shared React Context (`ConsentProvider`), not per-component `useState` — an earlier version had it as local state per component and `Tracking`/`ConsentBanner` silently disagreed about consent status. If you see it regress to local state, that's a bug, not a refactor.
- Vanta.js (if brought in per the polish stage) has a documented Vite double-export bug — see `C:\Users\AMIN\Desktop\.claude\skills\award-winning-site\references\vanta-vite-bug.md` before wiring it up.

## Stage 1 — what to build now

### 1. Database (`server/db.ts`)

Add these tables (SQLite, `CREATE TABLE IF NOT EXISTS`, same pattern as the existing `admin`/`settings` tables):

```sql
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'bobprod',
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT,
  ticket_url TEXT,
  is_published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT,
  requested_date TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS biolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

Theme colors: extend the existing `settings` key-value table with a new `theme` key (JSON: `{ accentRed, accentGold, bgColor }`), same pattern as the existing `seo`/`tracking`/`chatbot` keys in `getSettings()`/the various `update*()` functions.

Add corresponding TypeScript interfaces and CRUD helper functions (list/create/update/delete) for each table, following the exact style of the existing `getSettings()`/`updateSeo()` functions in `server/db.ts`.

### 2. Backend routes (`server/index.ts`)

Protected admin CRUD (reuse `requireAdmin` middleware, same as existing `/api/admin/settings*` routes):
- `GET/POST /api/admin/tracks`, `PUT/DELETE /api/admin/tracks/:id`
- `GET/POST /api/admin/events`, `PUT/DELETE /api/admin/events/:id`
- `GET /api/admin/bookings`, `PUT /api/admin/bookings/:id` (status change only)
- `GET/POST /api/admin/biolinks`, `PUT/DELETE /api/admin/biolinks/:id`
- `PUT /api/admin/theme`

Public read endpoints (no auth, mirror the existing `/api/public-config` pattern):
- `GET /api/public/tracks` — all tracks ordered by `sort_order`
- `GET /api/public/events` — only `is_published = 1`, ordered by `event_date`
- `GET /api/public/biolinks` — ordered by `sort_order`
- `POST /api/bookings` — public form submission (no auth), inserts into `bookings` with `status='pending'`

Extend `GET /api/public-config` to also include `theme` (accentRed/accentGold/bgColor) alongside the existing `seo`/`tracking`/`chatbotEnabled`.

File uploads for track audio/covers: use `multer`, store in `server/uploads/` (create the directory, `.gitignore` it), serve statically via `app.use('/uploads', express.static(...))`. Accept either an uploaded file or a pasted URL for `audio_url`/`cover_url` — don't require one over the other.

### 3. Admin UI (`src/pages/admin/`)

`AdminSettings.tsx` is already getting large (SEO/Tracking/Chatbot sections). Split into separate admin pages under new routes, all still behind the same `useAdminAuth` gate:
- `/admin/tracks` — list + add/edit form (title, artist, audio upload-or-URL, cover upload-or-URL), drag-to-reorder or simple up/down buttons for `sort_order`
- `/admin/events` — list + add/edit form (date, venue, city, ticket URL, published toggle)
- `/admin/bookings` — read-only list (name/email/date/message) with a status dropdown (pending/confirmed/declined) per row
- `/admin/biolinks` — list + add/edit form (platform name, label, URL), reorder
- `/admin/theme` — three color pickers (accent red/gold, base bg) with a live preview swatch
- Add a nav/sidebar in the admin area linking all of these plus the existing Settings page, since there are now 6 admin sections.

### 4. Public frontend wiring

- `src/pages/Music.tsx` — fetch `GET /api/public/tracks`, feed into the playlist player (currently `PlaylistPlayer.tsx` only knows the hardcoded SoundCloud profile — extend it to accept a track list, or run the SoundCloud embed and the admin-uploaded tracks as two distinct sections); replace the hardcoded `PLATFORMS` array with data from `GET /api/public/biolinks`.
- `src/pages/Events.tsx` — replace the hardcoded `EVENTS` array with `GET /api/public/events`.
- New `src/pages/Links.tsx` at route `/links` — renders all biolinks as a simple stacked list (standard "link-in-bio" page format).
- `src/pages/Contact.tsx` — replace the mailto CTA with a real form (name/email/event type/date/message) that `POST`s to `/api/bookings`.
- Apply `theme` from public config: in `Layout.tsx` or a small `useEffect` in `App.tsx`, set `document.documentElement.style.setProperty('--accent-red', theme.accentRed)` etc. once public config loads, so admin-edited colors take effect without a code change.

### 5. 21st.dev components (MCP server `21st` already configured in this session with an API key)

Fetch via `mcp__21st__get_component`:
- **Music Player Widget** — `smammar100`, demo id `12709` — spinning vinyl disc + audio-reactive visualizer + Web Audio API beat-sync
- **Event Card** — `ravikatiyar162`, demo id `8229`
- **Appointment Scheduler** — `vaib215`, demo id `9130`

Install each (`npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"`), then recolor from whatever default theme they ship with to the bobprod red/gold/black palette before wiring in:
- Music Player Widget → `/music` (replacing or supplementing `PlaylistPlayer`)
- Event Card → `/events` (one per event from `/api/public/events`)
- Appointment Scheduler → `/contact` (replacing the plain form, or keep the simple form as a fallback and offer both)

### 6. Critical gaps (do these regardless of time pressure — they're bugs, not polish)

- **404 page**: add `<Route path="*" element={<NotFound />} />` in `App.tsx`; currently unmatched routes render blank.
- **Error boundary**: wrap `<Outlet />` in `Layout.tsx` with a React error boundary component so one crashing page section doesn't blank the whole site (this exact failure mode already happened once with Vanta.js in the sibling `winner` project — don't let it recur here silently).
- **Rate limiting**: add `express-rate-limit` middleware on `/api/admin/login` (prevent brute force), `/api/chat` (prevent LLM cost abuse), and `/api/bookings` (prevent spam).
- **Privacy policy page** (`/privacy`): real content, linked from the footer and the cookie-consent banner — currently the consent banner implies a policy exists but there is none.

## Stages deferred (do not start without separate sign-off)

- **Stage 2**: Facebook Conversions API (direct server-side, not via Stape/AWS), TikTok Events API, LinkedIn Insight Tag, Google Ads/GA4 via existing GTM, AI-assisted SEO generation button in admin.
- **Stage 3**: multi-provider BYOK LLM settings (OpenRouter as the universal option covering DeepSeek/Gemini/Kimi/etc., plus direct OpenAI/Anthropic) extending the existing single-provider chatbot config.
- Auth providers module (Google/Facebook OAuth login for admin, BYOK client ID/secret pattern) — scoped in the plan but not detailed here; ask before implementing since it touches session/auth code.
- Setup wizard, EPK/press-kit page, newsletter signup, animated page transitions, admin analytics mini-dashboard, Vanta.js secondary section — all scoped as "polish," implement only if Stage 1 is done and verified first.
- CrowdSec (VPS-level, not app code) and Cloudflare Turnstile (form bot protection) — infrastructure/config, not application features to build blind.

## Verification

1. `npx tsc --noEmit` clean after every file batch, not just at the end.
2. Start both processes (`npm run server`, `npm run dev`), confirm no startup errors.
3. Through the actual admin UI (not just curl): create a track, an event, a biolink, change theme colors, submit a test booking from the public form and see it appear in `/admin/bookings`. Restart the server process and confirm everything persisted (proves SQLite writes, not just in-memory state).
4. Public pages: `/music` shows real tracks and biolinks, `/events` shows only published events, `/links` renders the biolink list, theme colors visibly apply.
5. Hit an unknown URL → confirm the 404 page renders, not a blank screen.
6. Temporarily throw an error inside a page component → confirm the error boundary catches it without blanking `Header`/`Footer`.
7. Hammer `/api/admin/login` with wrong passwords → confirm rate limiting kicks in (429 after N attempts).
8. No console errors on any route, checked in an actual browser (not just curl/tsc).
