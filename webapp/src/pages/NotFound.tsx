import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { usePublicConfig } from '../lib/publicConfig';

const DEFAULT_DESCRIPTION = "This page doesn't exist.";

export default function NotFound() {
  const config = usePublicConfig();
  const description = config.seo.description ?? DEFAULT_DESCRIPTION;

  return (
    <section className="mx-auto flex w-[min(480px,92vw)] flex-col items-center py-32 text-center">
      <Helmet>
        <title>Page not found — bobprod</title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Page not found — bobprod" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.svg" />
        <meta name="twitter:card" content="summary" />
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
