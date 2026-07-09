import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export function UnauthorizedPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5">
      <section className="glass-card max-w-xl p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Access restricted</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-white">This workspace is not available for your role.</h1>
        <p className="mt-4 text-slate-300">Sign in with the correct account or return to the public Apex Tutors page.</p>
        <Link className="apex-button-primary mt-6" to={ROUTES.HOME}>
          Back home
        </Link>
      </section>
    </main>
  );
}
