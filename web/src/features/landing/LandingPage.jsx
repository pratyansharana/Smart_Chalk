import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Atom,
  TrendingUp,
  FileCheck,
  Eye,
  Cpu,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { EnquiryForm } from './components/EnquiryForm';
import { FAQ } from './components/FAQ';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { Testimonials } from './components/Testimonials';

const valueProps = [
  {
    title: 'Live lessons for UAE time zones',
    detail: 'Schedule online Mathematics and Science lessons around convenient UAE evening hours.',
    icon: TrendingUp,
  },
  {
    title: 'Custom Curriculum Alignment',
    detail: 'Lessons, assignments, and practice tests are aligned to the student’s school syllabus, including CBSE, ICSE, British, and IB curricula.',
    icon: FileCheck,
  },
  {
    title: 'Progress reports for parents',
    detail: 'Parents receive point-wise email updates when homework or tests are graded.',
    icon: Eye,
  },
  {
    title: 'STEM & Tech Bootcamps',
    detail: 'Introductory Python and AI workshops are available alongside school subjects.',
    icon: Cpu,
  },
];

const coreCurriculum = [
  {
    title: 'Mathematics & Algebra',
    detail: 'Practise algebra, geometry, and other core skills with worked examples and clear reasoning.',
    icon: Calculator,
  },
  {
    title: 'Core Physics, Chemistry & Biology',
    detail: 'Study Physics, Chemistry, and Biology through structured explanations and guided practice.',
    icon: FlaskConical,
  },
  {
    title: 'English & Communication',
    detail: 'Support with reading, grammar, school writing, and verbal assessments.',
    icon: BookOpen,
  },
  {
    title: 'Python Programming & AI Logic',
    detail: 'Introductory coding and AI lessons focused on computational thinking and responsible tool use.',
    icon: Atom,
  },
];

export function LandingPage() {
  return (
    <main>
      <Hero />

      {/* Why Choose SmartChalk */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Why Choose Us</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">How SmartChalk supports learning.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <motion.article
                className="glass-card p-6"
                initial={{ opacity: 0, y: 16 }}
                key={prop.title}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 grid size-11 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
                  <Icon size={21} />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">{prop.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{prop.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Core Curriculum */}
      <section className="mx-auto max-w-7xl px-5 py-16 border-t border-white/5">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Our Core Curriculum</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Subjects and skills for Classes 4 to 10.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {coreCurriculum.map((curr, index) => {
            const Icon = curr.icon;
            return (
              <motion.article
                className="glass-card p-6"
                initial={{ opacity: 0, y: 16 }}
                key={curr.title}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 grid size-11 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
                  <Icon size={21} />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">{curr.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{curr.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="mx-auto w-full max-w-sm">
            <div className="aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-navy-900">
              <img
                alt="Pratyansha Rana, SmartChalk Mathematics and Science tutor"
                className="size-full object-cover object-[center_28%]"
                decoding="async"
                loading="lazy"
                src="/assets/Confident%20Portrait%20in%20a%20Linen%20Shirt.png"
              />
            </div>
          </div>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Meet your tutor</p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">Pratyansha Rana</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              I bring four years of tutoring experience and a technical foundation in Computer Science, AI, and Machine Learning to online Mathematics and Science lessons.
            </p>
            <p className="mt-3 leading-relaxed text-slate-400">
              Lessons are structured around the student’s curriculum, with clear explanations, guided practice, and progress updates for parents.
            </p>
            <Link className="apex-button-secondary mt-6" to={ROUTES.ABOUT}>
              About my teaching approach <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Pricing />
      <Testimonials />

      {/* Contact & Enquiry */}
      <section id="enquiry" className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1fr] lg:items-start border-t border-white/5">
        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Parent enquiry</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Start with a Clear Trial Conversation.</h2>
          <p className="mt-4 leading-relaxed text-sm text-slate-300">
            Share your child’s curriculum, grade, subjects, and learning goals. We’ll discuss the schedule and arrange a free trial session.
          </p>
        </div>
        <EnquiryForm />
      </section>

      <FAQ />

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400">
        SmartChalk / Online Mathematics and Science tutoring.
      </footer>
    </main>
  );
}
