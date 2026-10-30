import { motion } from 'framer-motion';
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
import { EnquiryForm } from './components/EnquiryForm';
import { FAQ } from './components/FAQ';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { Testimonials } from './components/Testimonials';

const valueProps = [
  {
    title: 'Indian Rigor, UAE Timezones',
    detail: 'Get India’s globally respected foundation in Mathematics and Sciences delivered live during convenient evening hours in UAE time zones—without the high local tutoring rates.',
    icon: TrendingUp,
  },
  {
    title: 'Custom Curriculum Alignment',
    detail: 'No generic, off-the-shelf PDFs. Every assignment, mock test, and lesson plan is customized to align perfectly with your child’s specific school syllabus (CBSE, ICSE, or British/IB).',
    icon: FileCheck,
  },
  {
    title: 'Zero-Chase Parent Updates',
    detail: 'Never spend time chasing tutors for feedback. You get automated, point-wise progress report emails sent to you the moment homework or tests are graded.',
    icon: Eye,
  },
  {
    title: 'STEM & Tech Bootcamps',
    detail: 'We teach coding along with schoolwork. Enhance your child’s logical reasoning skills with introductory bootcamps in Python programming and modern AI tools.',
    icon: Cpu,
  },
];

const coreCurriculum = [
  {
    title: 'Mathematics & Algebra Mastery',
    detail: 'Building absolute confidence in core topics like algebra and geometry, focusing on exam speed and concept clarity.',
    icon: Calculator,
  },
  {
    title: 'Core Physics, Chemistry & Biology',
    detail: 'Interactive and structured science lessons designed to build curiosity and improve school exam scores.',
    icon: FlaskConical,
  },
  {
    title: 'English & Communication',
    detail: 'Targeted support for critical reading, grammar structure, school essay writing, and verbal assessments.',
    icon: BookOpen,
  },
  {
    title: 'Python Programming & AI Logic',
    detail: 'Enriching core learning with logical reasoning bootcamps, programming concepts, and safe, productive AI logic.',
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
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Bridging the academic gap for UAE parents.</h2>
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
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Focused support for Classes 4 to 10.</h2>
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

      <Pricing />
      <Testimonials />

      {/* Contact & Enquiry */}
      <section id="enquiry" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1fr] lg:items-start border-t border-white/5">
        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Parent enquiry</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white">Start with a Clear Trial Conversation.</h2>
          <p className="mt-4 leading-relaxed text-sm text-slate-300">
            Finding the right tutor is a major decision. Let’s make sure we are the perfect fit for your child’s academic goals.
          </p>
          <p className="mt-4 leading-relaxed text-sm text-slate-300">
            Book a trial class today to experience our live instruction, preview our custom worksheets, and see how our parent-visible progress platform works. There is no commitment—just a clear, honest conversation about how we can help your child excel.
          </p>
        </div>
        <EnquiryForm />
      </section>

      <FAQ />

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400">
        SmartChalk / Premium online tutoring for focused learners.
      </footer>
    </main>
  );
}
