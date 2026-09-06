import type { MerchGridConfig } from '../../lib/types';

export function MerchGridBlock({ config }: { config: MerchGridConfig }) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-[min(900px,92vw)] py-16">
      <h2 className="font-display mb-6 text-2xl text-white">Merch</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, i) => {
          const card = (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-md">
              <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="truncate text-sm font-semibold text-white">{item.name}</span>
                <span className="flex-none text-sm text-white/60">{item.price}</span>
              </div>
            </div>
          );
          return item.url ? (
            <a key={i} href={item.url} target="_blank" rel="noreferrer">
              {card}
            </a>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
