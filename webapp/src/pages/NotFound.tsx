import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <section className="mx-auto flex w-[min(480px,92vw)] flex-col items-center py-32 text-center">
      <Helmet>
        <title>Page not found — bobprod</title>
      </Helmet>
      <p className="font-display text-6xl text-white">404</p>
      <p className="mt-3 text-sm text-white/55">This page doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 hover:bg-white/5"
      >
        Back home
      </Link>
    </section>
  );
}
