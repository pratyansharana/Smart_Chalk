import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { LoginForm } from './components/LoginForm';

export function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.9fr_0.7fr]">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Secure access</p>
        <h1 className="mt-3 font-heading text-5xl font-bold leading-none text-white">Welcome back to SmartChalk.</h1>
        <p className="mt-5 max-w-xl text-slate-300">
          Sign in to continue to your role-protected dashboard. The router resolves your workspace from your Firestore user role.
        </p>
        <p className="mt-6 text-sm text-slate-400">
          New here?{' '}
          <Link className="font-bold text-amber-400 hover:text-amber-300" to={ROUTES.SIGNUP}>
            Create an account
          </Link>
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
