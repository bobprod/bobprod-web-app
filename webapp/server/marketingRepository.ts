import { getSetting, setSetting } from './db.ts';
import { encrypt, decrypt, maskApiKey } from './crypto.ts';
import { conversionEvents, type ConversionEvent } from './repositories.ts';

export interface ConsentPolicy {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

// What's persisted in settings.tracking — secrets are stored encrypted, never in plaintext.
interface StoredTrackingConfig {
  gtm: { containerId: string };
  facebook: { pixelId: string; capiTokenEncrypted: string };
  tiktok: { pixelId: string; eventsApiTokenEncrypted: string };
  linkedin: { insightTagId: string };
  consentPolicy: ConsentPolicy;
}

const DEFAULT_CONFIG: StoredTrackingConfig = {
  gtm: { containerId: '' },
  facebook: { pixelId: '', capiTokenEncrypted: '' },
  tiktok: { pixelId: '', eventsApiTokenEncrypted: '' },
  linkedin: { insightTagId: '' },
  consentPolicy: { necessary: true, analytics: false, marketing: false },
};

function getStored(): StoredTrackingConfig {
  return getSetting('tracking', DEFAULT_CONFIG);
}

// ---------- admin: masked read / write ----------

export interface AdminTrackingConfig {
  gtm: { containerId: string };
  facebook: { pixelId: string; capiToken: string };
  tiktok: { pixelId: string; eventsApiToken: string };
  linkedin: { insightTagId: string };
  consentPolicy: ConsentPolicy;
}

export function getAdminConfig(): AdminTrackingConfig {
  const stored = getStored();
  return {
    gtm: stored.gtm,
    facebook: {
      pixelId: stored.facebook.pixelId,
      capiToken: stored.facebook.capiTokenEncrypted ? maskApiKey(decrypt(stored.facebook.capiTokenEncrypted)) : '',
    },
    tiktok: {
      pixelId: stored.tiktok.pixelId,
      eventsApiToken: stored.tiktok.eventsApiTokenEncrypted
        ? maskApiKey(decrypt(stored.tiktok.eventsApiTokenEncrypted))
        : '',
    },
    linkedin: stored.linkedin,
    consentPolicy: stored.consentPolicy,
  };
}

export function setAdminConfig(patch: AdminTrackingConfig): AdminTrackingConfig {
  const current = getStored();
  // A token field that's blank or still shows the masked placeholder means "keep the existing
  // secret" — mirrors the Assistant module's provider-key update semantics.
  const isMasked = (value: string) => !value || value.trim() === '' || value.includes('••••');

  const next: StoredTrackingConfig = {
    gtm: { containerId: patch.gtm?.containerId ?? '' },
    facebook: {
      pixelId: patch.facebook?.pixelId ?? '',
      capiTokenEncrypted: isMasked(patch.facebook?.capiToken ?? '')
        ? current.facebook.capiTokenEncrypted
        : encrypt(patch.facebook.capiToken),
    },
    tiktok: {
      pixelId: patch.tiktok?.pixelId ?? '',
      eventsApiTokenEncrypted: isMasked(patch.tiktok?.eventsApiToken ?? '')
        ? current.tiktok.eventsApiTokenEncrypted
        : encrypt(patch.tiktok.eventsApiToken),
    },
    linkedin: { insightTagId: patch.linkedin?.insightTagId ?? '' },
    consentPolicy: {
      necessary: true, // necessary cookies can never be declined
      analytics: !!patch.consentPolicy?.analytics,
      marketing: !!patch.consentPolicy?.marketing,
    },
  };
  setSetting('tracking', next);
  return getAdminConfig();
}

// ---------- public: only what's safe to ship to the browser ----------

export interface PublicTrackingConfig {
  gtmContainerId?: string;
  linkedInInsightTagId?: string;
  consentPolicy: ConsentPolicy;
}

export function getPublicConfig(): PublicTrackingConfig {
  const stored = getStored();
  return {
    gtmContainerId: stored.gtm.containerId || undefined,
    linkedInInsightTagId: stored.linkedin.insightTagId || undefined,
    consentPolicy: stored.consentPolicy,
  };
}

// ---------- server-side conversion sends (Meta CAPI + TikTok Events API) ----------

/**
 * Fires the Lead/SubmitForm conversion events for a new booking, if the visitor granted
 * marketing consent and the respective channel is configured. Intentionally fire-and-forget:
 * callers must not await this on the request path — a slow/failing ad-platform call must never
 * delay or break the booking confirmation the visitor sees.
 */
export async function fireBookingConversionEvents(bookingId: number, marketingConsent: boolean) {
  if (!marketingConsent) return;
  const stored = getStored();

  if (stored.facebook.pixelId && stored.facebook.capiTokenEncrypted) {
    await sendAndLog({
      channel: 'facebook_capi',
      eventType: 'Lead',
      bookingId,
      send: () => sendMetaCapiEvent(stored.facebook.pixelId, decrypt(stored.facebook.capiTokenEncrypted)),
    });
  }

  if (stored.tiktok.pixelId && stored.tiktok.eventsApiTokenEncrypted) {
    await sendAndLog({
      channel: 'tiktok_events',
      eventType: 'SubmitForm',
      bookingId,
      send: () => sendTiktokEvent(stored.tiktok.pixelId, decrypt(stored.tiktok.eventsApiTokenEncrypted)),
    });
  }
}

async function sendAndLog(opts: {
  channel: ConversionEvent['channel'];
  eventType: string;
  bookingId: number;
  send: () => Promise<unknown>;
}) {
  try {
    const result = await opts.send();
    conversionEvents.record({
      event_type: opts.eventType,
      channel: opts.channel,
      payload_json: JSON.stringify(result ?? {}),
      status: 'sent',
      booking_id: opts.bookingId,
    });
  } catch (err) {
    conversionEvents.record({
      event_type: opts.eventType,
      channel: opts.channel,
      payload_json: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      status: 'failed',
      booking_id: opts.bookingId,
    });
  }
}

// No PII (name/email) is ever included — only event metadata, per the module's privacy invariant.
async function sendMetaCapiEvent(pixelId: string, capiToken: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{ event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), action_source: 'website' }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta CAPI responded ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function sendTiktokEvent(pixelId: string, eventsApiToken: string) {
  const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': eventsApiToken },
    body: JSON.stringify({
      event_source: 'web',
      event_source_id: pixelId,
      data: [{ event: 'SubmitForm', event_time: Math.floor(Date.now() / 1000) }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`TikTok Events API responded ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// ---------- audit log ----------

export function listConversionEvents(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return {
    events: conversionEvents.list(pageSize, offset),
    total: conversionEvents.count(),
    page,
    pageSize,
  };
}
