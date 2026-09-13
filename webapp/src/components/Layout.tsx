import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from './ErrorBoundary';
import { ChatWidget } from './ChatWidget';
import { Tracking } from './Tracking';
import { ConsentBanner } from './ConsentBanner';
import { musicGroupJsonLd } from '../lib/seo';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Helmet encodeSpecialCharacters={false}>
        <script type="application/ld+json">{JSON.stringify(musicGroupJsonLd())}</script>
      </Helmet>
      <Tracking />
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatWidget />
      <ConsentBanner />
    </div>
  );
}
