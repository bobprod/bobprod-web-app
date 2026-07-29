import { Helmet } from 'react-helmet-async';

export default function Bio() {
  return (
    <section className="mx-auto w-[min(720px,92vw)] py-24">
      <Helmet>
        <title>Bio — bobprod</title>
      </Helmet>
      <h1 className="font-display text-3xl text-white">Bio</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-white/70">
        <p>
          bobprod is a house &amp; techno DJ and producer known for warehouse-ready sets that move between
          driving techno and warm, groove-led house. His latest EP, <em>Night Signal</em>, is out now.
        </p>
        <p>
          Recent shows include Tresor Club (Berlin), Le Sucre (Lyon), and De School (Amsterdam), with a
          European tour running through the fall.
        </p>
      </div>
      <a
        href="/press-kit.pdf"
        className="mt-8 inline-block rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        Download Full EPK
      </a>
    </section>
  );
}
