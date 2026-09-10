import { useId, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import type { NewsletterSignupConfig } from '../../lib/types';

export function NewsletterSignupBlock({ config }: { config: NewsletterSignupConfig }) {
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubscribing(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/api/newsletter', { email: form.get('email'), source: 'block' });
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <section className="mx-auto w-[min(560px,92vw)] py-16 text-center">
      <h2 className="font-display mb-4 text-2xl text-white">{config.headline ?? 'Join the list'}</h2>
      {subscribed ? (
        <div className="mx-auto w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          Thanks — you're on the list.
        </div>
      ) : (
        <form className="mx-auto flex w-full max-w-sm flex-col gap-2" onSubmit={handleSubmit}>
          <div className="flex w-full gap-2">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              name="email"
              type="email"
              required
              placeholder="Your email"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="flex-none rounded-xl bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-3 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {subscribing ? 'Sending…' : (config.buttonLabel ?? 'Subscribe')}
            </button>
          </div>
          {error && <p className="text-left text-xs text-red-400">{error}</p>}
        </form>
      )}
    </section>
  );
}
