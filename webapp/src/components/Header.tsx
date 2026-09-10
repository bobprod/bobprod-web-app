import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const LINKS = [
  { to: '/music', label: 'Music' },
  { to: '/events', label: 'Shows' },
  { to: '/bio', label: 'Bio' },
  { to: '/links', label: 'Links' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 mx-auto w-[min(720px,92vw)]">
      <div className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 backdrop-blur-md">
        <Logo />
        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-xs font-medium uppercase tracking-wide transition-colors ${
                  isActive ? 'text-white' : 'text-white/55 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/contact"
          className="hidden rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-white transition-[filter] hover:brightness-110 sm:inline-block"
        >
          Book Me
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white sm:hidden"
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-md sm:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 text-sm font-medium uppercase tracking-wide transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/contact"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-xl bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            Book Me
          </NavLink>
        </nav>
      )}
    </header>
  );
}
