import type { PressQuotesConfig } from '../../lib/types';

export function PressQuotesBlock({ config }: { config: PressQuotesConfig }) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-[min(900px,92vw)] py-16">
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-md"
          >
            {item.logoUrl && (
              <img src={item.logoUrl} alt={item.outlet} className="h-8 w-auto flex-none opacity-80" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm italic text-white/80">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/45">{item.outlet}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
