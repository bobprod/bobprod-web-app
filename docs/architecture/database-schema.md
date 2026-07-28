# Database schema

SQLite (`better-sqlite3`), same `CREATE TABLE IF NOT EXISTS` style as the existing `server/db.ts`.
Grouped by bounded context. Stage 1 tables (`admin`, `settings`, `tracks`, `events`, `bookings`,
`biolinks`) are reproduced from `project/uploads/CODING_AGENT_BRIEF.md` for completeness — **not
changed** here — followed by the new tables this spec adds for Assistant and Marketing.

## Identity

```sql
-- existing, Stage 1 — unchanged
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
```

## Site Configuration (generic key-value, existing pattern)

```sql
-- existing, Stage 1 — unchanged. Keys used: 'seo', 'tracking', 'chatbot', 'theme', 'general'
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL -- JSON blob
);
```

`theme`/`seo`/`general` (Admin Settings module) and `tracking` (Marketing module) all live here as
JSON blobs, same as the brief's existing `seo`/`chatbot` keys — see `admin-settings.md` and
`marketing.md` for each blob's shape.

## Catalog

```sql
-- existing, Stage 1 — unchanged
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'bobprod',
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

## Touring

```sql
-- existing, Stage 1 — unchanged
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT,
  ticket_url TEXT,
  is_published INTEGER NOT NULL DEFAULT 1
);
```

## Booking

```sql
-- existing, Stage 1 — unchanged
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
```

## Links

```sql
-- amended from Stage 1 — adds is_enabled (this spec, admin-settings.md).
-- No real deployment predates this change yet, so it's written directly into the
-- CREATE TABLE rather than as a separate ALTER TABLE migration.
CREATE TABLE IF NOT EXISTS biolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1
);
```

## Assistant (new — this spec)

```sql
CREATE TABLE IF NOT EXISTS llm_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openrouter', 'openai', 'anthropic', 'custom')),
  encrypted_api_key TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- enforced in the application layer (SetDefaultProviderCommand), not just here:
-- at most one row may have is_default = 1 at any time.

CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_session_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session
  ON chat_conversations (visitor_session_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  provider_id INTEGER REFERENCES llm_providers (id) ON DELETE SET NULL,
  tokens_used INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages (conversation_id);
```

`provider_id` uses `ON DELETE SET NULL` rather than `CASCADE` or a blocking foreign key: deleting a
provider config later must not delete chat history, it just loses the (cosmetic) record of which
provider answered.

## Marketing (new — this spec)

```sql
CREATE TABLE IF NOT EXISTS conversion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('facebook_capi', 'tiktok_events')),
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  booking_id INTEGER REFERENCES bookings (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_booking
  ON conversion_events (booking_id);
```

Same `ON DELETE SET NULL` reasoning as above — the audit log entry outlives the booking record it
was triggered by, in case bookings are ever pruned.

## Blocks (new — this spec)

```sql
CREATE TABLE IF NOT EXISTS page_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL CHECK (page IN ('home', 'bio', 'music', 'events', 'contact', 'links')),
  block_type TEXT NOT NULL CHECK (block_type IN (
    'newsletter_signup', 'merch_grid', 'testimonials', 'press_quotes', 'upcoming_shows', 'custom_html'
  )),
  is_enabled INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_page_blocks_page
  ON page_blocks (page, sort_order);
```

New block instances default to `is_enabled = 0` — a block is inert until an admin has configured
and deliberately enabled it, never live with default/empty content. `sort_order` is only ever
compared *within* the same `page` (enforced in the application layer's
`ReorderPageBlocksCommand`, per `content-blocks.md`), which is why the index leads with `page`.

## Migration notes

All new tables use `CREATE TABLE IF NOT EXISTS`, matching the existing `db.ts` convention — no
migration framework is introduced. This is consistent with the brief's "duplicate-per-client"
deployment model (each client gets a fresh `data.sqlite`, so there's no in-place upgrade path to
design for beyond what idempotent `CREATE TABLE IF NOT EXISTS` already provides). If the project
ever needs to alter an existing column (not just add a table), that's the point to introduce a
proper migration tool — not before.
