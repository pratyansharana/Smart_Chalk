import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Ritika Sharma',
    detail: 'UAE Expat Parent, Class 7',
    quote: 'The weekly review loop made progress visible without me chasing updates. The platform feels premium, but the teaching is still warm and personal.',
  },
  {
    name: 'Amit Verma',
    detail: 'Class 10 Student',
    quote: 'The test breakdowns helped me move from panic revision to a clear routine. The custom math worksheets saved my grades.',
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Social proof</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Trusted by families.</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {testimonials.map((test, index) => (
          <motion.article
            className="glass-card p-6"
            initial={{ opacity: 0, y: 18 }}
            key={test.name}
            transition={{ delay: index * 0.08 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, scale: 1.01 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-slate-200 leading-relaxed text-sm">"{test.quote}"</p>
            <h3 className="mt-5 font-heading text-lg font-bold text-white">{test.name}</h3>
            <p className="text-sm text-slate-400">{test.detail}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
