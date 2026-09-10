import { Helmet } from 'react-helmet-async';
import { BlockList } from '../components/blocks/BlockList';
import { usePublicConfig } from '../lib/publicConfig';
import { useRevealAnimations } from '../lib/useRevealAnimations';

const DEFAULT_DESCRIPTION =
  "bobprod is a house & techno DJ and producer known for warehouse-ready sets. Latest EP 'Night Signal' out now.";

export default function Bio() {
  const config = usePublicConfig();
  const description = config.seo.description ?? DEFAULT_DESCRIPTION;
  useRevealAnimations();

  return (
    <>
      <section className="mx-auto w-[min(720px,92vw)] py-24">
        <Helmet>
          <title>Bio — bobprod</title>
          <meta name="description" content={description} />
          <meta property="og:title" content="Bio — bobprod" />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/favicon.svg" />
          <meta name="twitter:card" content="summary" />
        </Helmet>
        <h1 className="font-display text-3xl text-white">Bio</h1>
        <div className="reveal mt-6 flex flex-col gap-4 text-sm leading-relaxed text-white/70">
          <p>
            bobprod is a house &amp; techno DJ and producer known for warehouse-ready sets that move between
            driving techno and warm, groove-led house. His latest EP, <em>Night Signal</em>, is out now.
          </p>
          <p>
            Recent shows include Tresor Club (Berlin), Le Sucre (Lyon), and De School (Amsterdam), with a
            European tour running through the fall.
          </p>
        </div>
      </section>

      <BlockList page="bio" />
    </>
  );
}
