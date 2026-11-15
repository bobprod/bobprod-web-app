import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import type { EventItem } from '../lib/types';
import { formatEventDate } from '../lib/date';
import { musicEventJsonLd } from '../lib/seo';
import { BlockList } from '../components/blocks/BlockList';
import { usePublicConfig } from '../lib/publicConfig';
import { eventMessage, whatsappUrl } from '../lib/whatsapp';
import { useRevealAnimations } from '../lib/useRevealAnimations';

const DEFAULT_DESCRIPTION = 'Upcoming tour dates and show tickets for bobprod — house & techno DJ and producer.';

export default function Events() {
  const config = usePublicConfig();
  const description = config.seo.description ?? DEFAULT_DESCRIPTION;
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<EventItem[]>('/api/public/events')
      .then(setEvents)
      .catch(() => setError(true));
  }, []);

  useRevealAnimations([events]);

  return (
    <section className="mx-auto w-[min(900px,92vw)] py-24">
      <Helmet>
        <title>Tour Dates — bobprod</title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Tour Dates — bobprod" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.svg" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      {events?.map((event) => (
        <Helmet key={event.id} encodeSpecialCharacters={false}>
          <script type="application/ld+json">{JSON.stringify(musicEventJsonLd(event))}</script>
        </Helmet>
      ))}
      <h1 className="font-display text-3xl text-white">Tour Dates</h1>

      <div className="reveal mt-8 grid gap-4 sm:grid-cols-2">
        {error && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
            Couldn't load shows right now. Try refreshing.
          </div>
        )}
        {!error && events === null && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </>
        )}
        {events?.length === 0 && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
            No shows announced yet — follow the socials for updates.
          </div>
        )}
        {events?.map((event) => {
          const { day, month } = formatEventDate(event.event_date);
          const reserveUrl = whatsappUrl(config.whatsappNumber, eventMessage(event));
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
                <p className="truncate text-xs text-white/60">{event.venue}</p>
              </div>
              <div className="flex flex-none flex-col items-end gap-2 sm:flex-row sm:items-center">
                {reserveUrl && (
                  <a
                    href={reserveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Réserver
                  </a>
                )}
                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:text-white"
                  >
                    Tickets
                  </a>
                )}
                {!reserveUrl && !event.ticket_url && (
                  <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50">Soon</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BlockList page="events" />
    </section>
  );
}
