import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, ApiError } from '../lib/api';

const EVENT_TYPES = ['Club Night', 'Private Event', 'Festival'];

export default function Contact() {
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/api/bookings', {
        name: form.get('name'),
        email: form.get('email'),
        event_type: eventType,
        requested_date: form.get('date') || null,
        message: form.get('message') || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="mx-auto flex w-[min(480px,92vw)] flex-col items-center py-32 text-center animate-fade-up">
        <h1 className="font-display text-2xl text-white">Request sent</h1>
        <p className="mt-3 text-sm text-white/60">
          Thanks — bobprod's team will get back to you shortly to confirm details.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-[min(560px,92vw)] py-24">
      <Helmet>
        <title>Booking — bobprod</title>
      </Helmet>
      <h1 className="font-display text-3xl text-white">Book bobprod</h1>
      <p className="mt-2 text-sm text-white/55">Tell us about your event and we'll follow up.</p>

      <div className="mt-6 flex gap-2">
        {EVENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setEventType(type)}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
              eventType === type
                ? 'border-transparent bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] text-white'
                : 'border-white/15 text-white/60 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs text-white/55">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-white/55">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-xs text-white/55">
            Preferred date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block text-xs text-white/55">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send Request'}
        </button>
      </form>
    </section>
  );
}
