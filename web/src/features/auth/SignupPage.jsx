import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { SignupForm } from './components/SignupForm';

export function SignupPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.9fr_0.7fr]">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Join SmartChalk</p>
        <h1 className="mt-3 font-heading text-5xl font-bold leading-none text-white">Create your protected workspace.</h1>
        <p className="mt-5 max-w-xl text-slate-300">
          Phase 2 creates a Firebase Auth account and a matching Firestore user profile with a role for RBAC routing.
        </p>
        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link className="font-bold text-amber-400 hover:text-amber-300" to={ROUTES.LOGIN}>
            Login
          </Link>
        </p>
      </section>
      <SignupForm />
    </main>
  );
}
