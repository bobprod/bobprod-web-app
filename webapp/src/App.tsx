import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PublicConfigProvider } from './lib/publicConfig';
import { AdminAuthProvider } from './components/AdminAuthProvider';
import { Layout } from './components/Layout';

import Home from './pages/Home';
import Music from './pages/Music';
import Bio from './pages/Bio';
import Events from './pages/Events';
import Links from './pages/Links';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminTracks = lazy(() => import('./pages/admin/AdminTracks'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminBiolinks = lazy(() => import('./pages/admin/AdminBiolinks'));
const AdminBlocks = lazy(() => import('./pages/admin/AdminBlocks'));
const AdminTheme = lazy(() => import('./pages/admin/AdminTheme'));
const AdminAssistant = lazy(() => import('./pages/admin/AdminAssistant'));
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers'));

function AdminFallback() {
  return <div className="min-h-screen bg-[#0a0a0a]" />;
}

function App() {
  return (
    <HelmetProvider>
      <PublicConfigProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/music" element={<Music />} />
                <Route path="/bio" element={<Bio />} />
                <Route path="/events" element={<Events />} />
                <Route path="/links" element={<Links />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
              </Route>

              <Route
                path="/admin/login"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLogin />
                  </Suspense>
                }
              />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminTracks />
                    </Suspense>
                  }
                />
                <Route
                  path="tracks"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminTracks />
                    </Suspense>
                  }
                />
                <Route
                  path="events"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminEvents />
                    </Suspense>
                  }
                />
                <Route
                  path="bookings"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminBookings />
                    </Suspense>
                  }
                />
                <Route
                  path="biolinks"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminBiolinks />
                    </Suspense>
                  }
                />
                <Route
                  path="blocks"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminBlocks />
                    </Suspense>
                  }
                />
                <Route
                  path="theme"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminTheme />
                    </Suspense>
                  }
                />
                <Route
                  path="assistant"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminAssistant />
                    </Suspense>
                  }
                />
                <Route
                  path="subscribers"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminSubscribers />
                    </Suspense>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </PublicConfigProvider>
    </HelmetProvider>
  );
}

export default App;
