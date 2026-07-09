import { motion } from 'framer-motion';
import { Atom, BookOpen, Calculator, FlaskConical, Languages, ShieldCheck } from 'lucide-react';
import { EnquiryForm } from './components/EnquiryForm';
import { FAQ } from './components/FAQ';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { Testimonials } from './components/Testimonials';

const curriculum = [
  ['Mathematics', 'Concept clarity, practice systems, and exam readiness.', Calculator],
  ['Science', 'Structured physics, chemistry, and biology foundations.', FlaskConical],
  ['English', 'Reading, writing, grammar, and school assessment support.', BookOpen],
  ['Hindi', 'Language confidence with guided practice and feedback.', Languages],
  ['STEM Skills', 'Logic, problem solving, and applied learning routines.', Atom],
  ['Parent Trust', 'Transparent progress loops and secure role-based access.', ShieldCheck],
];

export function LandingPage() {
  return (
    <main>
      <Hero />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Curriculum</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Focused support for Classes 4 to 10.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {curriculum.map(([title, detail, Icon], index) => (
            <motion.article
              className="glass-card p-5"
              initial={{ opacity: 0, y: 16 }}
              key={title}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.01 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4 grid size-11 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
                <Icon size={21} />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <Pricing />
      <Testimonials />
      <section id="enquiry" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Parent enquiry</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Start with a clear trial conversation.</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Enquiries write to Firestore through the leads service. Teachers will manage these leads in Phase 5.
          </p>
        </div>
        <EnquiryForm />
      </section>
      <FAQ />
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400">
        Apex Tutors / Premium online tutoring for focused learners.
      </footer>
    </main>
  );
}
