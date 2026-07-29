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

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminTracks from './pages/admin/AdminTracks';
import AdminEvents from './pages/admin/AdminEvents';
import AdminBookings from './pages/admin/AdminBookings';
import AdminBiolinks from './pages/admin/AdminBiolinks';
import AdminTheme from './pages/admin/AdminTheme';
import AdminAssistant from './pages/admin/AdminAssistant';

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

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminTracks />} />
                <Route path="tracks" element={<AdminTracks />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="biolinks" element={<AdminBiolinks />} />
                <Route path="theme" element={<AdminTheme />} />
                <Route path="assistant" element={<AdminAssistant />} />
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
