# API reference

Full endpoint list across every module. `Auth` column: **none** (public), or **admin**
(`requireAdmin` middleware — JWT session cookie, per the brief's existing `auth.ts`).

## Identity

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | none | Rate-limited (brief's critical-gap #3) |
| `POST` | `/api/admin/logout` | admin | |
| `GET` | `/api/admin/session` | admin | Session check |

## Catalog (existing, Stage 1)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` `POST` | `/api/admin/tracks` | admin | |
| `PUT` `DELETE` | `/api/admin/tracks/:id` | admin | |
| `GET` | `/api/public/tracks` | none | Ordered by `sort_order` |

## Touring (existing, Stage 1)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` `POST` | `/api/admin/events` | admin | |
| `PUT` `DELETE` | `/api/admin/events/:id` | admin | |
| `GET` | `/api/public/events` | none | Only `is_published = 1`, ordered by `event_date` |

## Booking (existing, Stage 1)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/admin/bookings` | admin | |
| `PUT` | `/api/admin/bookings/:id` | admin | Status change only |
| `POST` | `/api/bookings` | none | Rate-limited (brief's critical-gap #3); raises `BookingRequestSubmitted` |

## Links (existing, Stage 1)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` `POST` | `/api/admin/biolinks` | admin | |
| `PUT` `DELETE` | `/api/admin/biolinks/:id` | admin | |
| `GET` | `/api/public/biolinks` | none | Ordered by `sort_order` |

## Site Configuration (`admin-settings.md`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/admin/settings` | admin | `{ theme, seo, general }` |
| `PUT` | `/api/admin/theme` | admin | |
| `PUT` | `/api/admin/settings/seo` | admin | |
| `PUT` | `/api/admin/settings/general` | admin | |

## Assistant (`assistant-llm.md`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/chat` | none | Rate-limited; 503 if no active default provider |
| `GET` | `/api/admin/assistant/providers` | admin | Keys masked |
| `POST` | `/api/admin/assistant/providers` | admin | |
| `PUT` | `/api/admin/assistant/providers/:id` | admin | Empty key field = keep existing key |
| `DELETE` | `/api/admin/assistant/providers/:id` | admin | Refuses to delete the last default without a replacement |
| `PUT` | `/api/admin/assistant/providers/:id/default` | admin | Atomic swap |
| `POST` | `/api/admin/assistant/providers/:id/test` | admin | Ping/latency check |
| `PUT` | `/api/admin/settings/chatbot` | admin | Existing Stage 1 toggle |

## Marketing (`marketing.md`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/admin/marketing` | admin | Tokens masked |
| `PUT` | `/api/admin/marketing` | admin | |
| `GET` | `/api/admin/marketing/events` | admin | Paginated conversion audit log |
| `POST` | `/api/admin/marketing/seo-suggest` | admin | Draft only, not auto-saved |

## Cross-cutting

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/public-config` | none | Aggregates `theme`, `seo` (current route), `tracking` (public IDs only), `chatbotEnabled` — fetched once by `PublicConfigProvider` |

## Error conventions (applies everywhere)

- `401` — no/invalid session on an admin route.
- `404` — unknown resource id, or a public route the brief's "critical gaps" section flags
  (unmatched route renders `NotFound`, not blank).
- `429` — rate-limited (`/api/admin/login`, `/api/chat`, `/api/bookings`).
- `503` — a feature is reachable but unconfigured (e.g. `/api/chat` with no default LLM provider)
  — distinct from `500`, which is reserved for genuine unexpected failures the error boundary
  (brief's critical-gap #2) should catch on the frontend.
