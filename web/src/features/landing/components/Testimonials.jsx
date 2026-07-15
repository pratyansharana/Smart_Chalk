import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Aadya Singh',
    detail: 'Student, GEMS Our Own English High School, Dubai',
    quote: 'The worksheets and instant AI grading on Smart Chalk helped me identify my mistakes immediately. It has made practicing mathematics much more engaging and effective.',
  },
  {
    name: 'Vania Kapoor',
    detail: 'Student, GEMS Our Own English High School, Dubai',
    quote: 'Having all my learning materials, batch vault resources, and teacher evaluations in one central place is amazing. The platform is sleek, fast, and incredibly easy to use.',
  },
  {
    name: 'Arnav Singh',
    detail: 'Student, GEMS Our Own English High School, Dubai',
    quote: 'The personalized practice tests and step-by-step score breakdowns saved me so much time. It moved me from stressful last-minute cramming to a structured, confident study routine.',
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Social proof</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Trusted by families.</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {testimonials.map((test, index) => (
          <motion.article
            className="glass-card p-6 flex flex-col justify-between"
            initial={{ opacity: 0, y: 18 }}
            key={test.name}
            transition={{ delay: index * 0.08 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, scale: 1.01 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-slate-200 leading-relaxed text-sm">"{test.quote}"</p>
            <div>
              <h3 className="mt-5 font-heading text-base font-bold text-white">{test.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{test.detail}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

