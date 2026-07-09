import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const HeroScene = lazy(() => import('../../../components/three/HeroScene'));

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative isolate grid min-h-[calc(100vh-5rem)] overflow-hidden px-5 py-16 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_60%_35%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(16,185,129,0.16),transparent_28%),#0B1120]" />
      {!prefersReducedMotion && (
        <div className="absolute inset-y-0 right-0 -z-10 w-full opacity-80 lg:w-[62%]">
          <Suspense fallback={<div className="h-full w-full bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />}>
            <HeroScene />
          </Suspense>
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl lg:col-span-2 lg:grid lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <div className="glass-card max-w-3xl p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Premium dark glass tutoring</p>
          <h1 className="mt-4 font-heading text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">
            Precision tutoring for ambitious learners.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Apex Tutors blends live instruction, worksheet accountability, and parent-visible progress inside a role-secure learning platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="apex-button-primary" href="#enquiry">Book a trial</a>
            <Link className="apex-button-secondary" to={ROUTES.LOGIN}>Login</Link>
          </div>
        </div>
        <div className="mt-8 grid gap-4 lg:mt-0">
          <div className="glass-card ml-auto max-w-md p-5">
            <span className="live-dot mr-2" />
            <span className="text-sm font-bold text-emerald-300">Live Now</span>
            <h2 className="mt-3 font-heading text-2xl font-bold text-white">Algebra mastery session</h2>
            <p className="mt-2 text-sm text-slate-300">Teacher-led lesson, live doubt support, post-class worksheet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
