import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { EventItem } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const EMPTY_FORM = { event_date: '', venue: '', city: '', ticket_url: '' };

export default function AdminEvents() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setError(false);
    setEvents(null);
    api
      .get<EventItem[]>('/api/admin/events')
      .then(setEvents)
      .catch(() => setError(true));
  }

  useEffect(load, []);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.event_date || !form.venue) return;
    setSaving(true);
    try {
      const created = await api.post<EventItem>('/api/admin/events', {
        ...form,
        city: form.city || null,
        ticket_url: form.ticket_url || null,
      });
      setEvents((prev) => [...(prev ?? []), created]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function update(id: number, patch: Partial<EventItem>) {
    const updated = await api.put<EventItem>(`/api/admin/events/${id}`, patch);
    setEvents((prev) => prev?.map((ev) => (ev.id === id ? updated : ev)) ?? null);
  }

  async function remove(id: number) {
    await api.del(`/api/admin/events/${id}`);
    setEvents((prev) => prev?.filter((ev) => ev.id !== id) ?? null);
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Events</h1>
      <p className="mb-6 text-sm text-white/50">Tour dates shown on the public Shows page.</p>

      <form
        onSubmit={addEvent}
        className="mb-6 grid grid-cols-[1fr_1.2fr_1fr_1.4fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4"
      >
        <input
          type="date"
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Ticket URL"
          value={form.ticket_url}
          onChange={(e) => setForm({ ...form, ticket_url: e.target.value })}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <AdminStateBlock
        loading={!error && events === null}
        error={error}
        empty={events?.length === 0}
        emptyLabel="No events yet — add one above."
        onRetry={load}
      />

      {events && events.length > 0 && (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {ev.event_date} · {ev.venue}
                </p>
                <p className="truncate text-xs text-white/45">{ev.city}</p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-white/55">
                <input
                  type="checkbox"
                  checked={!!ev.is_published}
                  onChange={(e) => update(ev.id, { is_published: e.target.checked ? 1 : 0 })}
                />
                Published
              </label>
              <button
                type="button"
                onClick={() => remove(ev.id)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-red-500/40 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
