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
    title: 'The India-UAE Advantage',
    detail: 'Benefit from India’s globally recognized rigorous foundation in Mathematics and Sciences, delivered seamlessly in UAE time zones. High-quality, dedicated education without the premium local price tag.',
    icon: TrendingUp,
  },
  {
    title: 'Strictly Syllabus-Compliant Materials',
    detail: 'We do not use generic, off-the-shelf PDFs. Every test paper, engaging worksheet, and lesson plan is custom-designed to align perfectly with your child’s specific school curriculum.',
    icon: FileCheck,
  },
  {
    title: 'The Parent-Transparent Progress Loop',
    detail: 'No more chasing tutors for updates. Inside our role-secure platform, parents get complete visibility into assignments, class performance, and grade tracking. Progress is always visible.',
    icon: Eye,
  },
  {
    title: 'Future-Ready Skill Building',
    detail: 'We don’t just teach for the next exam; we prepare students for the next decade. Alongside core academics, we integrate specialized training in logical reasoning, Python programming, and modern AI tools.',
    icon: Cpu,
  },
];

const coreCurriculum = [
  {
    title: 'Mathematics & Algebra Mastery',
    detail: 'From foundational concept clarity to mastering complex algebraic expressions. We build practice systems that ensure absolute exam readiness.',
    icon: Calculator,
  },
  {
    title: 'Core Sciences',
    detail: 'Structured, engaging foundations in physics, chemistry, and biology to build scientific curiosity and academic rigor.',
    icon: FlaskConical,
  },
  {
    title: 'English & Communication',
    detail: 'Comprehensive support for reading, writing, grammar, and school assessments.',
    icon: BookOpen,
  },
  {
    title: 'STEM & Future Tech',
    detail: 'Logic, problem-solving, and applied learning routines featuring Python programming and AI literacy.',
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

      {/* About Me Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 border-t border-white/5">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Meet Your Tutor</p>
            <h2 className="mt-2 font-heading text-4xl font-bold text-white">Structuring Chaos into Academic Success.</h2>
            <div className="mt-6 space-y-4 text-slate-300 leading-relaxed text-sm">
              <p>
                Hello, and welcome to SmartChalk.
              </p>
              <p>
                As a premium online tutor based in India, I specialize in bridging the educational gap for expat families and busy professionals in the UAE. I focus exclusively on primary and middle schoolers (Classes 4 to 10) because I believe these are the critical years where a student’s relationship with learning is permanently shaped.
              </p>
              <p className="font-bold text-white pt-2 border-t border-white/5">
                My Philosophy: No Fluff, Just Results
              </p>
              <p>
                I know the frustration UAE parents face: online classes that feel like glorified screen-time, tutors who lack genuine investment, and a disconnect between what is taught and what appears on the school exam.
              </p>
              <p>
                That is why I built my methodology around <strong className="text-amber-400">strict syllabus compliance</strong>. I spend hours meticulously designing custom test papers, targeted worksheets, and personalized lesson plans that adapt to how your child learns best. When I teach complex topics—like breaking down intimidating algebraic expressions into manageable, logical steps—I don't just lecture; I ensure comprehension through our secure, interactive platform.
              </p>
            </div>
          </div>
          <div className="glass-card p-6 border-amber-400/20 bg-amber-500/[0.01]">
            <h3 className="font-heading text-2xl font-bold text-white mb-4">Why I Teach</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              I am deeply passionate about moving students from "panic revision to a clear routine." Whether we are mastering core math concepts or writing our first lines of Python code, my goal is to build confident, independent, and future-ready learners. The platform feels premium, but my teaching remains warm, highly personal, and entirely dedicated to your child's success.
            </p>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Future-Ready Tech Bootcamps</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Preparing for tomorrow’s tech landscape requires more than just standard schooling. Our specialized short-term programs are designed to give your child a distinct competitive edge:
              </p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Intensive Summer Bootcamps:</strong> Maximize the summer break with highly structured, engaging deep dives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Python Programming:</strong> Learn to write actual code, build basic apps, and develop computational thinking.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>AI Tools & Prompt Engineering:</strong> Safe, effective use of AI tools for research, logic, and problem-solving.</span>
                </li>
              </ul>
            </div>
          </div>
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
