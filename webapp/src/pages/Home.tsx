import { Helmet } from 'react-helmet-async';
import { Hero } from '../components/Hero';
import { usePublicConfig } from '../lib/publicConfig';
import { BlockList } from '../components/blocks/BlockList';

export default function Home() {
  const config = usePublicConfig();
  const title = config.seo.title ?? 'bobprod — House & Techno DJ / Producer';
  const description = config.seo.description ?? 'bobprod — house & techno DJ and producer. New EP out now.';
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.svg" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <Hero />
      <BlockList page="home" />
    </>
  );
}
