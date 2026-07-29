import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const LINKS = [
  { to: '/music', label: 'Music' },
  { to: '/events', label: 'Shows' },
  { to: '/bio', label: 'Bio' },
  { to: '/links', label: 'Links' },
];

export function Header() {
  return (
    <header className="sticky top-4 z-50 mx-auto flex w-[min(720px,92vw)] items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 backdrop-blur-md">
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
        className="rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-white transition-[filter] hover:brightness-110"
      >
        Book Me
      </NavLink>
    </header>
  );
}
