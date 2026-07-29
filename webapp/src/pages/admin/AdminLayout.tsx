import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../lib/useAdminAuth';

const NAV = [
  { to: '/admin/tracks', label: 'Tracks' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/biolinks', label: 'Links' },
  { to: '/admin/theme', label: 'Branding' },
  { to: '/admin/assistant', label: 'Assistant' },
];

export default function AdminLayout() {
  const { isAuthenticated, loading, logout } = useAdminAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <aside className="flex w-56 flex-none flex-col border-r border-white/10 p-5">
        <p className="font-display mb-6 text-lg text-white">bobprod</p>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-white/45 hover:text-white"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
