import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Subscriber } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setSubscribers(null);
    api
      .get<Subscriber[]>('/api/admin/subscribers')
      .then(setSubscribers)
      .catch(() => setError(true));
  }

  useEffect(load, []);

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Subscribers</h1>
      <p className="mb-6 text-sm text-white/50">Everyone who signed up through a newsletter form on the site.</p>

      <AdminStateBlock
        loading={!error && subscribers === null}
        error={error}
        empty={subscribers?.length === 0}
        emptyLabel="No subscribers yet."
        onRetry={load}
      />

      {subscribers && subscribers.length > 0 && (
        <div className="flex flex-col gap-2">
          {subscribers.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{s.email}</p>
                <span className="flex-none rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60">
                  {s.source ?? 'unknown'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/45">{s.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
