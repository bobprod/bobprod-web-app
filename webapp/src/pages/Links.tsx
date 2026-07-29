import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import type { Biolink } from '../lib/types';

const PLATFORM_COLORS: Record<string, string> = {
  spotify: '#1ED760',
  'apple music': 'linear-gradient(135deg,#FA233B,#FB5C74)',
  deezer: '#00C7F2',
  beatport: '#01FF95',
  soundcloud: '#FF7700',
  youtube: '#FF0000',
  instagram: 'linear-gradient(135deg,#feda75,#d62976,#4f5bd5)',
};

function platformStyle(platform: string) {
  const bg = PLATFORM_COLORS[platform.toLowerCase()] ?? 'rgba(255,255,255,.12)';
  return { background: bg };
}

export default function Links() {
  const [links, setLinks] = useState<Biolink[] | null>(null);
  const [error, setError] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api
      .get<Biolink[]>('/api/public/biolinks')
      .then((data) => setLinks(data.filter((l) => l.is_enabled)))
      .catch(() => setError(true));
  }, []);

  return (
    <section className="mx-auto flex w-[min(460px,92vw)] flex-col items-center px-2 py-16 text-center">
      <Helmet>
        <title>bobprod — Links</title>
      </Helmet>

      <div className="mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-red)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
          Live from Warehouse 12
        </span>
      </div>

      <div className="mb-4 flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-white/15 bg-gradient-to-br from-white/10 to-white/[0.03]" />

      <h1 className="font-display text-base text-white">bobprod</h1>
      <p className="mt-1 mb-6 max-w-[280px] text-[12.5px] text-white/55">
        House &amp; techno DJ / producer. New EP "Night Signal" out now.
      </p>

      {subscribed ? (
        <div className="mb-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          Thanks — you're on the list.
        </div>
      ) : (
        <form
          className="mb-6 flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubscribed(true);
          }}
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="Your email"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs text-white placeholder:text-white/40"
          />
          <button
            type="submit"
            className="flex-none rounded-xl bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-3 text-xs font-semibold text-white hover:brightness-110"
          >
            Subscribe
          </button>
        </form>
      )}

      <div className="flex w-full flex-col gap-2.5">
        {error && <p className="text-xs text-white/45">Couldn't load links right now.</p>}
        {!error &&
          links === null &&
          [0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-[18px] bg-white/5" />)}
        {links?.length === 0 && <p className="text-xs text-white/45">No links yet.</p>}
        {links?.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-[18px] border border-white/[0.09] bg-white/[0.045] px-4 py-[13px] backdrop-blur-md transition-transform hover:bg-white/[0.07] active:scale-[.97]"
          >
            <span
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[11px] font-bold text-black"
              style={platformStyle(link.platform)}
            >
              {link.platform.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-semibold text-white">{link.label}</span>
              <span className="block truncate text-[11px] text-white/45">{link.platform}</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,.4)"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
        ))}
      </div>

      <p className="mt-8 text-[10.5px] text-white/30">&copy; {new Date().getFullYear()} bobprod</p>
    </section>
  );
}
