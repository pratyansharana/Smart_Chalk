import { motion } from 'framer-motion';

const plans = [
  ['Foundation', '₹2,500/mo', '2 live classes weekly, worksheets, monthly review'],
  ['Core', '₹4,000/mo', '4 live classes weekly, doubt support, test tracking'],
  ['Board Prep', '₹6,500/mo', 'Mock tests, focused revision, weekly parent review'],
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Transparent pricing</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Choose the learning intensity.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(([name, price, detail]) => (
          <motion.article
            className="glass-card p-6"
            key={name}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <h3 className="font-heading text-2xl font-bold text-white">{name}</h3>
            <p className="mt-4 text-3xl font-black text-amber-400">{price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
