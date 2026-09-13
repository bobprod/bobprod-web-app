import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminTrackingConfig, ConversionEvent } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const labelCls = 'text-xs text-white/55';

const STATUS_STYLES: Record<ConversionEvent['status'], string> = {
  sent: 'text-green-400 border-green-400/40',
  failed: 'text-red-400 border-red-400/40',
};

export default function AdminMarketing() {
  const [config, setConfig] = useState<AdminTrackingConfig | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [seo, setSeo] = useState({ title: '', description: '' });
  const [seoRoute, setSeoRoute] = useState('/');
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const [events, setEvents] = useState<{ events: ConversionEvent[]; total: number } | null>(null);
  const [eventsPage, setEventsPage] = useState(1);

  function load() {
    setError(false);
    setConfig(null);
    api.get<AdminTrackingConfig>('/api/admin/marketing').then(setConfig).catch(() => setError(true));
    api.get<{ title: string; description: string }>('/api/admin/settings/seo').then(setSeo).catch(() => {});
  }

  useEffect(load, []);

  useEffect(() => {
    api
      .get<{ events: ConversionEvent[]; total: number }>(
        `/api/admin/marketing/events?page=${eventsPage}&pageSize=10`,
      )
      .then(setEvents)
      .catch(() => setEvents(null));
  }, [eventsPage]);

  async function save() {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const updated = await api.put<AdminTrackingConfig>('/api/admin/marketing', config);
      setConfig(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save marketing settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function generateSeo() {
    setSeoGenerating(true);
    setSeoError(null);
    try {
      const result = await api.post<{ title: string; description: string }>('/api/admin/marketing/seo-suggest', {
        route: seoRoute,
      });
      setSeo(result);
    } catch (err) {
      setSeoError(err instanceof Error ? err.message : 'Could not generate SEO copy.');
    } finally {
      setSeoGenerating(false);
    }
  }

  async function saveSeo() {
    await api.put('/api/admin/settings/seo', seo);
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Marketing</h1>
      <p className="mb-6 text-sm text-white/50">
        Analytics tags, conversion tracking, and SEO — all gated on visitor consent.
      </p>

      <AdminStateBlock
        loading={!error && config === null}
        error={error}
        empty={false}
        emptyLabel=""
        onRetry={load}
      />

      {config && (
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Google Tag Manager</h2>
            <label className={labelCls}>
              Container ID
              <input
                className={`${inputCls} mt-1`}
                placeholder="GTM-XXXXXXX"
                value={config.gtm.containerId}
                onChange={(e) => setConfig({ ...config, gtm: { containerId: e.target.value } })}
              />
            </label>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Meta Conversions API</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelCls}>
                Pixel ID
                <input
                  className={`${inputCls} mt-1`}
                  value={config.facebook.pixelId}
                  onChange={(e) => setConfig({ ...config, facebook: { ...config.facebook, pixelId: e.target.value } })}
                />
              </label>
              <label className={labelCls}>
                CAPI access token
                <input
                  className={`${inputCls} mt-1`}
                  placeholder={config.facebook.capiToken || 'Not set'}
                  onChange={(e) => setConfig({ ...config, facebook: { ...config.facebook, capiToken: e.target.value } })}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">TikTok Events API</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelCls}>
                Pixel ID
                <input
                  className={`${inputCls} mt-1`}
                  value={config.tiktok.pixelId}
                  onChange={(e) => setConfig({ ...config, tiktok: { ...config.tiktok, pixelId: e.target.value } })}
                />
              </label>
              <label className={labelCls}>
                Events API access token
                <input
                  className={`${inputCls} mt-1`}
                  placeholder={config.tiktok.eventsApiToken || 'Not set'}
                  onChange={(e) =>
                    setConfig({ ...config, tiktok: { ...config.tiktok, eventsApiToken: e.target.value } })
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">LinkedIn Insight Tag</h2>
            <label className={labelCls}>
              Partner ID
              <input
                className={`${inputCls} mt-1`}
                value={config.linkedin.insightTagId}
                onChange={(e) => setConfig({ ...config, linkedin: { insightTagId: e.target.value } })}
              />
            </label>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Consent categories offered to visitors</h2>
            <p className="mb-3 text-xs text-white/45">
              Turn off a category you don't use — the cookie banner won't offer it, and no data for it will
              ever be sent, even if a visitor clicks "Accept all".
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked disabled />
                Necessary (always on)
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={config.consentPolicy.analytics}
                  onChange={(e) =>
                    setConfig({ ...config, consentPolicy: { ...config.consentPolicy, analytics: e.target.checked } })
                  }
                />
                Analytics (GTM, LinkedIn Insight Tag)
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={config.consentPolicy.marketing}
                  onChange={(e) =>
                    setConfig({ ...config, consentPolicy: { ...config.consentPolicy, marketing: e.target.checked } })
                  }
                />
                Marketing (Meta CAPI, TikTok Events)
              </label>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save marketing settings'}
            </button>
            {saved && <span className="text-xs text-green-400">Saved.</span>}
            {saveError && <span className="text-xs text-red-400">{saveError}</span>}
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-1 text-sm font-semibold text-white">SEO</h2>
        <p className="mb-3 text-xs text-white/45">Homepage title and meta description, with optional AI drafting.</p>
        <div className="mb-3 flex gap-2">
          <input
            className={inputCls}
            placeholder="Route context (e.g. /)"
            value={seoRoute}
            onChange={(e) => setSeoRoute(e.target.value)}
          />
          <button
            type="button"
            onClick={generateSeo}
            disabled={seoGenerating}
            className="flex-none rounded-lg border border-white/15 px-3.5 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-60"
          >
            {seoGenerating ? 'Generating…' : 'Generate with AI'}
          </button>
        </div>
        {seoError && <p className="mb-2 text-xs text-red-400">{seoError}</p>}
        <label className={labelCls}>
          Title
          <input className={`${inputCls} mt-1`} value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
        </label>
        <label className={`${labelCls} mt-3 block`}>
          Description
          <textarea
            rows={2}
            className={`${inputCls} mt-1`}
            value={seo.description}
            onChange={(e) => setSeo({ ...seo, description: e.target.value })}
          />
        </label>
        <button
          type="button"
          onClick={saveSeo}
          className="mt-3 rounded-lg border border-white/15 px-4 py-1.5 text-xs text-white/80 hover:bg-white/5"
        >
          Save SEO
        </button>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">Conversion events audit log</h2>
        {events && events.events.length === 0 && (
          <p className="text-sm text-white/45">No conversion events logged yet.</p>
        )}
        {events && events.events.length > 0 && (
          <div className="flex flex-col gap-2">
            {events.events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                <span className="text-white/70">
                  {ev.event_type} · {ev.channel} · booking #{ev.booking_id ?? '—'}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-white/40">{ev.sent_at}</span>
                  <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLES[ev.status]}`}>{ev.status}</span>
                </span>
              </div>
            ))}
            {events.total > 10 && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={eventsPage === 1}
                  onClick={() => setEventsPage((p) => p - 1)}
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={eventsPage * 10 >= events.total}
                  onClick={() => setEventsPage((p) => p + 1)}
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
