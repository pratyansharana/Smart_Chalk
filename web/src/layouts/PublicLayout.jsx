import { GraduationCap, LogIn, UserPlus } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(16,185,129,0.10),transparent_28%),#0B1120] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="flex items-center gap-3" to={ROUTES.HOME}>
            <span className="grid size-11 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-400">
              <GraduationCap size={22} />
            </span>
            <span>
              <span className="block font-heading text-lg font-bold text-white">SmartChalk</span>
              <span className="block text-xs text-slate-400">Premium online tutoring</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link className={location.pathname === ROUTES.LOGIN ? 'apex-button-primary' : 'apex-button-secondary'} to={ROUTES.LOGIN}>
              <LogIn size={16} />
              Login
            </Link>
            <Link className="hidden sm:inline-flex apex-button-secondary" to={ROUTES.SIGNUP}>
              <UserPlus size={16} />
              Sign up
            </Link>
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
