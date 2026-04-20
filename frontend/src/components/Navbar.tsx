import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = user
      ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Niche Finder', path: '/niche-finder' },
        { name: 'Daily Idea', path: '/daily-idea' },
        { name: 'Nutriție', path: '/client-nutrition', disabled: true, badge: 'Upcoming' },
        { name: 'Content Review', path: '/content-review' },
      ]
    : [
        { name: 'Acasă', path: '/' },
        { name: 'Funcționalități', path: '/features' },
        { name: 'Prețuri', path: '/pricing' },
      ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="console-panel-strong mx-auto max-w-7xl rounded-[28px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-cyan-300/20 blur-md" />
              <img
                src="/logo.jpeg"
                alt="TrainerOS Logo"
                className="relative h-11 w-11 rounded-2xl border border-cyan-300/25 object-cover shadow-[0_0_24px_rgba(114,202,255,0.12)]"
              />
            </div>
            <div>
              <span className="console-kicker block text-[10px]">TrainerOS Console</span>
              <span className="text-lg font-bold text-white font-display">TrainerOS</span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {navLinks.map((link) => (
              link.disabled ? (
                <span
                  key={link.path}
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/6 bg-white/[0.02] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  {link.name}
                  {link.badge && (
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {link.badge}
                    </span>
                  )}
                </span>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'bg-cyan-300/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(114,202,255,0.12)]'
                      : 'text-slate-300 hover:bg-white/[0.045] hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden lg:block rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  {user.name}
                </div>
                <Link to="/settings#plans">
                  <Button variant="primary" size="sm" className="!px-4 !py-2.5">
                    Upgrade
                  </Button>
                </Link>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Start Trial
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/8 py-4 md:hidden">
            <div className="mb-4 grid gap-2">
              {navLinks.map((link) => (
                link.disabled ? (
                  <div
                    key={link.path}
                    className="flex cursor-not-allowed items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-base font-medium text-slate-500"
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        {link.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`rounded-2xl px-4 py-3 text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-cyan-300/12 text-white'
                        : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>

            <div className="grid gap-3 border-t border-white/8 pt-4">
              {user ? (
                <>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    {user.name || user.email}
                  </div>
                  <Link to="/settings#plans" onClick={closeMobileMenu}>
                    <Button variant="primary" className="w-full">
                      Upgrade Plan
                    </Button>
                  </Link>
                  <Button onClick={() => { logout(); closeMobileMenu(); }} variant="outline" className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="secondary" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button variant="primary" className="w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
