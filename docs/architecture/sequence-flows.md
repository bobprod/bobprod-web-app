# Sequence flows

Cross-module flows that don't belong to a single module doc. The booking → conversion-tracking
flow is diagrammed in `marketing.md` (it's Marketing reacting to a Booking domain event); this doc
covers the other two flows that cross module boundaries: a visitor chat message, and an admin
config change reaching the public site.

## Visitor sends a chat message

```mermaid
sequenceDiagram
    participant Visitor
    participant Widget as ChatWidget
    participant RateLimit as express-rate-limit
    participant Api as POST /api/chat
    participant UC as SendChatMessageCommand
    participant Factory as LLMClientFactory
    participant Provider as LLMClient (adapter)
    participant LLM as Configured provider API
    participant DB as SQLite

    Visitor->>Widget: types a message
    Widget->>Api: POST { message, sessionId }
    Api->>RateLimit: check IP + session rate
    alt over limit
        RateLimit-->>Widget: 429 Too Many Requests
    else within limit
        Api->>UC: SendChatMessageCommand
        UC->>DB: load or create ChatConversation(sessionId)
        UC->>DB: find default+active LLMProviderConfig
        alt no active default config
            UC-->>Widget: 503 (assistant not configured)
        else config found
            UC->>Factory: resolve(config.providerType)
            Factory-->>UC: Provider adapter instance
            UC->>Provider: send(conversation.messages + new message, config.modelId)
            Provider->>LLM: provider-specific request (decrypted key, server-side only)
            LLM-->>Provider: completion
            Provider-->>UC: ChatCompletion
            UC->>DB: append user + assistant ChatMessage (snapshot providerId)
            UC-->>Widget: { reply }
        end
    end
    Widget-->>Visitor: shows reply
```

Two guard rails visible directly in the diagram: the rate-limit check happens **before** any LLM
call (protects the BYOK key's spend, not just the server's CPU), and the "no active default
config" branch means an unconfigured assistant fails cleanly with a clear status instead of a
confusing error from a factory that can't resolve anything.

## Admin changes a setting → public site picks it up

```mermaid
sequenceDiagram
    participant Admin
    participant AdminUI as Admin SPA (e.g. /admin/theme)
    participant Api as PUT /api/admin/theme
    participant UC as UpdateThemeCommand
    participant DB as SQLite (settings table)
    participant PublicConfigApi as GET /api/public-config
    participant Visitor
    participant Provider as PublicConfigProvider

    Admin->>AdminUI: edits accent colors, saves
    AdminUI->>Api: PUT { accentRed, accentGold, bgColor }
    Api->>UC: UpdateThemeCommand
    UC->>UC: validate hex values
    UC->>DB: persist theme key
    UC-->>AdminUI: 200 OK
    AdminUI-->>Admin: shows saved confirmation + live preview swatch

    Note over Visitor,Provider: separately, on next page load
    Visitor->>Provider: app mounts
    Provider->>PublicConfigApi: GET /api/public-config (fetched once)
    PublicConfigApi->>DB: read theme/seo/tracking/chatbotEnabled
    DB-->>PublicConfigApi: current settings
    PublicConfigApi-->>Provider: { theme, seo, tracking, chatbotEnabled }
    Provider->>Provider: setProperty('--accent-red', ...) etc.
```

The two halves of this diagram are intentionally separated by the `Note` — this is the documented
"load-time read, not a live push" behavior from `admin-settings.md`. A visitor with the site
already open in a tab won't see the new theme until they reload; that's a conscious scope
boundary, not a bug to silently work around with polling.

## Where each flow's detail lives

| Flow | Full detail |
| --- | --- |
| Booking submission → FB/TikTok conversion events | `marketing.md` |
| Chat message | above |
| Admin setting → public config | above |
| Admin CRUD (tracks/events/bookings/biolinks) | Unchanged from `project/uploads/CODING_AGENT_BRIEF.md` Stage 1 — standard REST CRUD, no new sequence needed |
