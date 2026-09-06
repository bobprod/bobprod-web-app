import type { TestimonialsConfig } from '../../lib/types';

export function TestimonialsBlock({ config }: { config: TestimonialsConfig }) {
  const quotes = config.quotes ?? [];
  if (quotes.length === 0) return null;

  return (
    <section className="mx-auto w-[min(900px,92vw)] py-16">
      <div className="grid gap-4 sm:grid-cols-2">
        {quotes.map((q, i) => (
          <blockquote
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-md"
          >
            <p className="text-sm italic text-white/80">&ldquo;{q.text}&rdquo;</p>
            <footer className="mt-3 text-xs text-white/45">— {q.attribution}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
