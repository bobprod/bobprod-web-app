import { Helmet } from 'react-helmet-async';
import { Hero } from '../components/Hero';
import { usePublicConfig } from '../lib/publicConfig';

export default function Home() {
  const config = usePublicConfig();
  return (
    <>
      <Helmet>
        <title>{config.seo.title ?? 'bobprod — House & Techno DJ / Producer'}</title>
        <meta
          name="description"
          content={config.seo.description ?? 'bobprod — house & techno DJ and producer. New EP out now.'}
        />
      </Helmet>
      <Hero />
    </>
  );
}
