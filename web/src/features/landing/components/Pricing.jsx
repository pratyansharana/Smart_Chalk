import { motion } from 'framer-motion';

const includedFeatures = [
  '1-hour live interactive sessions',
  'UK and international curriculum support',
  'Custom digital worksheets and practice material',
  'Automated parent progress reports',
];

const plans = [
  {
    name: '2 Days / Week',
    classes: '8 classes / month',
    price: '$99',
    aed: '~AED 365',
    bestFor: 'Ideal for targeted weekly reinforcement and homework help.',
  },
  {
    name: '3 Days / Week',
    classes: '12 classes / month',
    price: '$139',
    aed: '~AED 510',
    bestFor: 'Best balance of consistent progress and curriculum mastery.',
    popular: true,
  },
  {
    name: '5 Days / Week',
    classes: '20 classes / month',
    price: '$199',
    aed: '~AED 730',
    bestFor: 'Intensive daily mentoring for accelerated learning.',
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">International monthly plans</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">Choose the support that fits.</h2>
        <p className="mt-2 text-sm text-slate-300">Prices shown in USD, with approximate AED equivalents.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <motion.article
            className={`glass-card relative flex flex-col p-5 sm:p-6 ${plan.popular ? 'border-amber-400/60 bg-amber-500/[0.06] shadow-[0_0_36px_rgba(245,158,11,0.12)]' : ''}`}
            key={plan.name}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div className="flex min-h-8 items-start justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">{plan.classes}</p>
              {plan.popular && <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-navy-950">Most Popular</span>}
            </div>
            <h3 className="mt-3 font-heading text-2xl font-bold text-white">{plan.name}</h3>
            <p className="mt-5 text-5xl font-black leading-none text-amber-400">{plan.price}<span className="ml-2 text-base font-semibold text-slate-300">/ month</span></p>
            <p className="mt-2 text-sm font-semibold text-slate-400">{plan.aed}</p>
            <p className="mt-5 min-h-12 text-sm leading-6 text-slate-300">{plan.bestFor}</p>
            <ul className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-slate-200">
              {includedFeatures.map((feature) => (
                <li className="flex items-start gap-2.5" key={feature}>
                  <span aria-hidden="true" className="mt-0.5 text-emerald-300">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a className={`mt-6 w-full ${plan.popular ? 'apex-button-primary' : 'apex-button-secondary'}`} href="#enquiry">Book a free trial</a>
          </motion.article>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">All plans include a risk-free trial class. No hidden fees.</p>
    </section>
  );
}
