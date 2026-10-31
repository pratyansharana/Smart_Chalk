import { motion } from 'framer-motion';

const includedFeatures = [
  '1-hour live interactive sessions',
  'CBSE and ICSE support, with UK curriculum options',
  'Custom digital worksheets and practice material',
  'Automated parent progress reports',
];

const plans = [
  {
    name: 'Group of 2 · 3 Days / Week',
    price: '₹4,000',
    bestFor: 'Three days of weekly lessons for a pair of students.',
  },
  {
    name: 'Group of 2 · 5 Days / Week',
    price: '₹6,000',
    bestFor: 'Five days of weekly lessons for a pair of students.',
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Monthly group plans</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">Choose your weekly schedule.</h2>
        <p className="mt-2 text-sm text-slate-300">Prices shown in INR per month.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <motion.article
            className={`glass-card relative flex flex-col p-5 sm:p-6 ${plan.popular ? 'border-amber-400/60 bg-amber-500/[0.06] shadow-[0_0_36px_rgba(245,158,11,0.12)]' : ''}`}
            key={plan.name}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <h3 className="font-heading text-2xl font-bold text-white">{plan.name}</h3>
            <p className="mt-5 text-5xl font-black leading-none text-amber-400">{plan.price}<span className="ml-2 text-base font-semibold text-slate-300">/ month</span></p>
            <p className="mt-5 min-h-12 text-sm leading-6 text-slate-300">{plan.bestFor}</p>
            <ul className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-slate-200">
              {includedFeatures.map((feature) => (
                <li className="flex items-start gap-2.5" key={feature}>
                  <span aria-hidden="true" className="mt-0.5 text-emerald-300">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a className="apex-button-primary mt-6 w-full" href="#enquiry">Book a free trial</a>
          </motion.article>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">All plans include a risk-free trial class. No hidden fees.</p>
    </section>
  );
}
