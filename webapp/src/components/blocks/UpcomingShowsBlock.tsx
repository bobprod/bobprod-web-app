import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { EventItem, UpcomingShowsConfig } from '../../lib/types';
import { formatEventDate } from '../../lib/date';

export function UpcomingShowsBlock({ config }: { config: UpcomingShowsConfig }) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const limit = config.limit && config.limit > 0 ? config.limit : 3;

  useEffect(() => {
    api
      .get<EventItem[]>('/api/public/events')
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const shown = (events ?? []).slice(0, limit);
  if (events !== null && shown.length === 0) return null;

  return (
    <section className="mx-auto w-[min(900px,92vw)] py-16">
      <h2 className="font-display mb-6 text-2xl text-white">Upcoming Shows</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map((event) => {
          const { day, month } = formatEventDate(event.event_date);
          return (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-md"
            >
              <div className="flex w-14 flex-none flex-col items-center rounded-xl bg-white/5 py-2">
                <span className="text-lg font-bold text-white">{day}</span>
                <span className="text-[10px] uppercase text-white/50">{month}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{event.city ?? 'TBA'}</p>
                <p className="truncate text-xs text-white/45">{event.venue}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
