import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import type { Track } from '../lib/types';

export default function Music() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<Track[]>('/api/public/tracks')
      .then(setTracks)
      .catch(() => setError(true));
  }, []);

  return (
    <section className="mx-auto w-[min(760px,92vw)] py-24">
      <Helmet>
        <title>Music — bobprod</title>
      </Helmet>
      <h1 className="font-display text-3xl text-white">Music</h1>
      <p className="mt-2 text-sm text-white/55">Latest releases and mixes.</p>

      <div className="mt-8 flex flex-col gap-3">
        {error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/55">
            Couldn't load tracks right now. Try refreshing.
          </div>
        )}
        {!error && tracks === null && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </>
        )}
        {tracks?.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/55">
            No tracks yet — check back soon.
          </div>
        )}
        {tracks?.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-md"
          >
            <div className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5">
              {track.cover_url && <img src={track.cover_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{track.title}</p>
              <p className="truncate text-xs text-white/45">{track.artist}</p>
            </div>
            <audio controls src={track.audio_url} className="h-9 max-w-[180px]" />
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">SoundCloud</p>
        <a
          href="https://soundcloud.com/bobby-prod"
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-sm text-white/80 hover:text-white"
        >
          soundcloud.com/bobby-prod →
        </a>
      </div>
    </section>
  );
}
