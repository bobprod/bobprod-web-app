import { Link } from 'react-router-dom';
import { ParticleField } from './ParticleField';

export function Hero() {
  return (
    <section className="relative flex h-[92vh] min-h-[560px] items-center justify-center overflow-hidden bg-gradient-to-b from-[#232120] to-[#141312]">
      <ParticleField />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6 px-6 text-center">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-red)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
            Live from Warehouse 12
          </span>
        </div>
        <h1 className="font-display text-5xl leading-tight text-white sm:text-7xl">
          NIGHT
          <br />
          SIGNAL
        </h1>
        <p className="max-w-sm text-sm text-white/60">
          House &amp; techno from bobprod — new EP out now, tour dates across Europe this fall.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/music"
            className="rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            ▶ Listen Now
          </Link>
          <Link
            to="/events"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"
          >
            Tour Dates
          </Link>
        </div>
      </div>
    </section>
  );
}
