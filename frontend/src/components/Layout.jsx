import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UI } from '../utils/strings';

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = useMemo(() => [
    ...(!isHome ? [{ to: '/', label: 'Start' }] : []),
    { to: '/quiz', label: UI.quizUpload },
    { to: '/zahlenfolgen', label: UI.numberSequences },
    { to: '/figuren', label: UI.figureAssembly },
    { to: '/wortfluessigkeit', label: UI.wordFluency },
    { to: '/history', label: UI.history },
  ], [isHome]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
          focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:font-semibold
          focus:shadow-floating focus:outline-none"
      >
        Zum Inhalt springen
      </a>

      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(20,189,110,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(255,128,16,0.2) 0%, transparent 60%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]" style={{ filter: 'url(#grain)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 sm:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg px-1 -mx-1 min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-brand-300 sm:w-[18px] sm:h-[18px]">
                <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="font-display text-lg sm:text-xl text-white tracking-heading truncate">
              <span className="sm:hidden">MedAT Trainer</span>
              <span className="hidden sm:inline">{UI.appTitle}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} active={location.pathname === link.to}>
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 text-sm font-body font-medium text-brand-300/70 rounded-lg
                hover:bg-white/10 hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                active:scale-95 transition-transform duration-150"
            >
              Abmelden
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg
              hover:bg-white/10
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
              active:scale-90 transition-transform duration-150"
            aria-label="Menü"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden relative border-t border-white/10">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-body font-medium rounded-lg
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                    active:scale-[0.98] transition-transform duration-150 ${
                    location.pathname === link.to
                      ? 'bg-white/15 text-white'
                      : 'text-brand-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-4 py-3 text-sm font-body font-medium text-brand-300/70 rounded-lg
                  hover:bg-white/10 hover:text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                  active:scale-[0.98] transition-transform duration-150"
              >
                Abmelden
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      <div className="h-1 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 opacity-40" />
    </div>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 text-sm font-body font-medium rounded-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
        active:scale-95 transition-transform duration-150 ${
        active
          ? 'bg-white/15 text-white'
          : 'text-brand-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}
