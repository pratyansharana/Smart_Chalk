import { motion } from 'framer-motion';

const testimonials = [
  ['Ritika Sharma', 'Parent, Class 7', 'The weekly review loop made progress visible without me chasing updates.'],
  ['Amit Verma', 'Class 10', 'The test breakdowns helped me move from panic revision to a clear routine.'],
  ['Neha Iyer', 'Parent, Class 5', 'The platform feels premium, but the teaching is still warm and personal.'],
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Social proof</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Trusted by families.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map(([name, detail, quote], index) => (
          <motion.article
            className="glass-card p-6"
            initial={{ opacity: 0, y: 18 }}
            key={name}
            transition={{ delay: index * 0.08 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, scale: 1.01 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-slate-200">"{quote}"</p>
            <h3 className="mt-5 font-heading text-lg font-bold text-white">{name}</h3>
            <p className="text-sm text-slate-400">{detail}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
