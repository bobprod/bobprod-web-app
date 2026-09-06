import DOMPurify from 'dompurify';
import type { CustomHtmlConfig } from '../../lib/types';

// Defensive second sanitize pass — the server already sanitizes on write, but this ensures
// sanitization isn't a single point of failure (docs/architecture/content-blocks.md).
export function CustomHtmlBlock({ config }: { config: CustomHtmlConfig }) {
  if (!config.html) return null;
  const clean = DOMPurify.sanitize(config.html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
  });

  return (
    <section className="mx-auto w-[min(760px,92vw)] py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <div
        className="flex flex-col gap-3 text-sm leading-relaxed text-white/80 [&_a]:text-[var(--accent-gold)] [&_h1]:font-display [&_h1]:text-2xl [&_h1]:text-white [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-white [&_iframe]:w-full [&_iframe]:rounded-xl [&_img]:rounded-xl"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </section>
  );
}
