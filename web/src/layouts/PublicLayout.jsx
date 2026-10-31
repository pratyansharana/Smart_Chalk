import { GraduationCap, LogIn, Menu, UserPlus, X } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ROUTES } from '../constants/routes';
import { ThemeToggle } from '../components/common/ThemeToggle';

export function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="theme-public-shell min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(16,185,129,0.10),transparent_28%),#0B1120] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="flex items-center gap-3" to={ROUTES.HOME}>
            <span className="grid size-11 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-400">
              <GraduationCap size={22} />
            </span>
            <span>
              <span className="block font-heading text-lg font-bold text-white">SmartChalk</span>
              <span className="block text-xs text-slate-400">Math &amp; Science tutoring</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <ThemeToggle compact />
            <Link className={`px-2 py-2 text-sm font-bold transition hover:text-amber-300 ${location.pathname === ROUTES.ABOUT ? 'text-amber-300' : 'text-slate-300'}`} to={ROUTES.ABOUT}>
              About
            </Link>
            <Link className={location.pathname === ROUTES.LOGIN ? 'apex-button-primary' : 'apex-button-secondary'} to={ROUTES.LOGIN}>
              <LogIn size={16} />
              Login
            </Link>
            <Link className="hidden sm:inline-flex apex-button-secondary" to={ROUTES.SIGNUP}>
              <UserPlus size={16} />
              Sign up
            </Link>
          </div>
          <ThemeToggle compact className="sm:hidden" />
          <button
            aria-controls="public-mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-100 sm:hidden"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>
        {mobileMenuOpen && (
          <>
            <button
              aria-label="Dismiss navigation menu"
              className="fixed inset-0 z-30 bg-black/50 sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
              type="button"
            />
            <div className="absolute inset-x-0 top-full z-50 grid gap-2 border-b border-white/10 bg-navy-950 p-4 shadow-xl sm:hidden" id="public-mobile-menu">
              <Link className="apex-button-secondary w-full justify-start" onClick={() => setMobileMenuOpen(false)} to={ROUTES.ABOUT}>About</Link>
              <Link className="apex-button-primary w-full justify-start" onClick={() => setMobileMenuOpen(false)} to={`${ROUTES.HOME}#enquiry`}>Book a free trial</Link>
              <Link className="apex-button-secondary w-full justify-start" onClick={() => setMobileMenuOpen(false)} to={ROUTES.LOGIN}><LogIn size={17} /> Login</Link>
              <Link className="apex-button-secondary w-full justify-start" onClick={() => setMobileMenuOpen(false)} to={ROUTES.SIGNUP}><UserPlus size={17} /> Sign up</Link>
            </div>
          </>
        )}
      </header>
      <Outlet />
    </div>
  );
}
