import { useId, useState } from 'react';
import type { NewsletterSignupConfig } from '../../lib/types';

export function NewsletterSignupBlock({ config }: { config: NewsletterSignupConfig }) {
  const [subscribed, setSubscribed] = useState(false);
  const inputId = useId();

  return (
    <section className="mx-auto w-[min(560px,92vw)] py-16 text-center">
      <h2 className="font-display mb-4 text-2xl text-white">{config.headline ?? 'Join the list'}</h2>
      {subscribed ? (
        <div className="mx-auto w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          Thanks — you're on the list.
        </div>
      ) : (
        <form
          className="mx-auto flex w-full max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubscribed(true);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <input
            id={inputId}
            type="email"
            required
            placeholder="Your email"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs text-white placeholder:text-white/40"
          />
          <button
            type="submit"
            className="flex-none rounded-xl bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-3 text-xs font-semibold text-white hover:brightness-110"
          >
            {config.buttonLabel ?? 'Subscribe'}
          </button>
        </form>
      )}
    </section>
  );
}
