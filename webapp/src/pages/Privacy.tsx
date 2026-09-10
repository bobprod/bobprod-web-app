import { Helmet } from 'react-helmet-async';
import { usePublicConfig } from '../lib/publicConfig';

const DEFAULT_DESCRIPTION = 'Privacy policy for the bobprod website.';

export default function Privacy() {
  const config = usePublicConfig();
  const description = config.seo.description ?? DEFAULT_DESCRIPTION;

  return (
    <section className="mx-auto w-[min(680px,92vw)] py-24 text-sm leading-relaxed text-white/70">
      <Helmet>
        <title>Privacy Policy — bobprod</title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Privacy Policy — bobprod" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.svg" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <h1 className="font-display mb-6 text-3xl text-white">Privacy Policy</h1>
      <p className="mb-4">
        This site collects the information you submit through the booking and newsletter forms (name, email,
        and event details) to respond to your request. We use cookies for essential site function and, only
        with your consent, for analytics and advertising measurement.
      </p>
      <p className="mb-4">
        We do not sell your personal data. You can withdraw consent for non-essential cookies at any time
        via the cookie banner. For any request regarding your data, contact us through the booking form.
      </p>
    </section>
  );
}
