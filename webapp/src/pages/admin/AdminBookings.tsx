import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Booking } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const STATUS_STYLES: Record<Booking['status'], string> = {
  pending: 'text-[var(--accent-gold)] border-[var(--accent-gold)]/40',
  confirmed: 'text-green-400 border-green-400/40',
  declined: 'text-red-400 border-red-400/40',
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setBookings(null);
    api
      .get<Booking[]>('/api/admin/bookings')
      .then(setBookings)
      .catch(() => setError(true));
  }

  useEffect(load, []);

  async function setStatus(id: number, status: Booking['status']) {
    const updated = await api.put<Booking>(`/api/admin/bookings/${id}`, { status });
    setBookings((prev) => prev?.map((b) => (b.id === id ? updated : b)) ?? null);
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Bookings</h1>
      <p className="mb-6 text-sm text-white/50">Requests submitted through the public contact form.</p>

      <AdminStateBlock
        loading={!error && bookings === null}
        error={error}
        empty={bookings?.length === 0}
        emptyLabel="No booking requests yet."
        onRetry={load}
      />

      {bookings && bookings.length > 0 && (
        <div className="flex flex-col gap-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {b.name} · {b.email}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {b.event_type ?? '—'} · {b.requested_date ?? 'no date'} · {b.created_at}
                  </p>
                  {b.message && <p className="mt-2 text-xs text-white/60">{b.message}</p>}
                </div>
                <span className={`flex-none rounded-full border px-3 py-1 text-[11px] font-medium ${STATUS_STYLES[b.status]}`}>
                  {b.status}
                </span>
              </div>
              {b.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(b.id, 'confirmed')}
                    className="rounded-lg border border-green-400/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-400/10"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(b.id, 'declined')}
                    className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
