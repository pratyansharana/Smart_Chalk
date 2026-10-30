import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Foundation (3 Days/Week)',
    bestFor: 'Building strong concept foundations.',
    detail: '3 live classes weekly, customized homework sheets, and automated parent grade reports.',
  },
  {
    name: 'Standard (5 Days/Week)',
    bestFor: 'Daily study tracking and grade acceleration.',
    detail: '5 live classes weekly, real-time doubt support, and monthly mock test cycles.',
  },
  {
    name: 'Board Prep (Class 9 & 10)',
    bestFor: 'Targeted syllabus mastery and exam excellence.',
    detail: 'Complete 9th & 10th grade prep, previous years papers mock-drills, and focus revision sessions.',
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">International monthly packages</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Choose the learning intensity.</h2>
        <p className="mt-2 text-sm text-slate-300">Monthly tuition quoted in AED or USD.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <motion.article
            className="glass-card p-6 flex flex-col justify-between"
            key={plan.name}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div>
              <h3 className="font-heading text-2xl font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{plan.bestFor}</p>
              <p className="mt-4 text-2xl font-black text-amber-400">Request a monthly quote</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300 border-t border-white/5 pt-3">{plan.detail}</p>
            <a className="apex-button-primary mt-5" href="#enquiry">Request AED/USD pricing</a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
