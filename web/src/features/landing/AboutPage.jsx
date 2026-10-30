import { ArrowRight, BrainCircuit, GraduationCap, Laptop, Lightbulb, Mail, MessagesSquare, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const teachingSteps = [
  {
    number: '01',
    title: 'Make the idea clear',
    detail: 'Start with the concept and the rules behind it, using a worked example or visual analogy to make the reasoning easier to follow.',
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'Practise one step at a time',
    detail: 'Build from guided questions to independent practice, with patient explanations whenever a step needs another look.',
    icon: Laptop,
  },
  {
    number: '03',
    title: 'Grow lasting confidence',
    detail: 'Adjust the pace to the learner and connect new topics to what they already know, so progress feels steady and earned.',
    icon: MessagesSquare,
  },
];

function GoogleWordmark() {
  return (
    <span aria-label="Google" className="whitespace-nowrap" role="img">
      <span aria-hidden="true" className="text-[#4285F4]">G</span>
      <span aria-hidden="true" className="text-[#EA4335]">o</span>
      <span aria-hidden="true" className="text-[#FBBC05]">o</span>
      <span aria-hidden="true" className="text-[#4285F4]">g</span>
      <span aria-hidden="true" className="text-[#34A853]">l</span>
      <span aria-hidden="true" className="text-[#EA4335]">e</span>
    </span>
  );
}

export function AboutPage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_32%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_22%_18%,rgba(245,158,11,0.12),transparent_32%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.75fr] lg:gap-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Meet your tutor</p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Mathematics and Science, explained step by step.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              I’m <strong className="text-white">Pratyansha Rana</strong>, an online Mathematics and Science tutor. For four years, I’ve helped school students turn difficult topics into ideas they can understand, practise, and use with confidence.
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
              I support learners across UK and international curricula, including UK Years 6–8, as well as domestic boards such as CBSE and ICSE. My aim is simple: make learning clear, purposeful, and personal to each student.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link className="apex-button-primary" to={`${ROUTES.HOME}#enquiry`}>
                Book a free trial <ArrowRight size={18} />
              </Link>
              <a className="inline-flex max-w-full items-center gap-2 break-all text-sm text-slate-300 transition hover:text-amber-300" href="mailto:pratyanshrana1@gmail.com">
                <Mail className="shrink-0" size={17} aria-hidden="true" />
                pratyanshrana1@gmail.com
              </a>
              <a className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-amber-300" href="tel:+917302358183">
                <Phone className="shrink-0" size={17} aria-hidden="true" />
                +91 7302351838
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(245,158,11,0.18),rgba(16,185,129,0.14),rgba(15,23,42,0.95))]">
              <div className="absolute inset-0 grid place-items-center text-center" aria-hidden="true">
                <div>
                  <div className="mx-auto grid size-20 place-items-center rounded-full border border-amber-300/30 bg-navy-950/50 font-heading text-2xl font-bold text-amber-300">PR</div>
                  <p className="mt-4 text-sm font-semibold text-slate-300">Pratyansha Rana</p>
                </div>
              </div>
              <img
                alt="Portrait of Pratyansha Rana"
                className="absolute inset-0 size-full object-cover object-[center_28%]"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                src="/assets/Confident%20Portrait%20in%20a%20Linen%20Shirt.png"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-400">
              <span>Mathematics &amp; Science tutor</span>
              <span className="inline-flex items-center gap-2 text-emerald-300"><span className="live-dot" /> Online lessons</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.72fr_1.28fr] md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Background &amp; expertise</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">How my technical background shapes my teaching.</h2>
        </div>
        <div className="space-y-5 text-base leading-relaxed text-slate-300">
          <p>
            I’m pursuing a Bachelor of Engineering in Computer Science, with a focus on Artificial Intelligence and Machine Learning, at Lakshmi Narain College of Technology &amp; Science in Bhopal. I expect to graduate in 2028.
          </p>
          <p>
            I completed a Cisco Networking Academy virtual internship from June to August 2026 and serve as Chapter Lead for <GoogleWordmark /> Developer Groups on Campus at LNCTS. I was also a first runner-up at the Innomaker Project Showcase for QUBES.
          </p>
          <p>
            My development work spans cross-platform apps, AI/ML, and explorations in post-quantum cryptography. This technical foundation shapes how I teach: I break complex problems into logical steps, test the reasoning, and help students understand why a solution works instead of relying on rote memorisation.
          </p>
          <div className="grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="font-heading text-xl font-bold text-amber-300">4 years</p><p className="mt-1 text-sm text-slate-400">Tutoring experience</p></div>
            <div><p className="font-heading text-xl font-bold text-amber-300">B.E. CSE</p><p className="mt-1 text-sm text-slate-400">AI/ML focus, expected 2028</p></div>
            <div><p className="font-heading text-base font-bold leading-tight text-white"><GoogleWordmark /> Developer Groups</p><p className="mt-1 text-sm leading-5 text-slate-400">on Campus Chapter Lead, LNCTS</p></div>
            <div><p className="font-heading text-xl font-bold text-amber-300">1st Runner-Up</p><p className="mt-1 text-sm text-slate-400">Innomaker Project Showcase</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">The teaching philosophy</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">A clear, step-by-step approach.</h2>
            <p className="mt-4 leading-relaxed text-slate-300">Every student deserves enough time, clarity, and encouragement to make a difficult topic their own.</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {teachingSteps.map(({ number, title, detail, icon: Icon }) => (
              <article className="border-t border-amber-400/30 pt-5" key={number}>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="font-heading text-sm font-bold">{number}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-16 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Learning with SmartChalk</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">Digital tools for practice and progress.</h2>
          <p className="mt-5 leading-relaxed text-slate-300">
            Digital tools should make learning more engaging and keep families in the loop. SmartChalk brings live lessons, custom practice, and clear feedback together, giving students a purposeful next step after class and parents a better view of progress.
          </p>
        </div>
        <div className="space-y-5 border-l border-emerald-400/30 pl-6 sm:pl-8">
          <div className="flex gap-4">
            <BrainCircuit className="mt-1 shrink-0 text-emerald-300" size={22} />
            <div><h3 className="font-heading text-lg font-bold text-white">Custom homework</h3><p className="mt-1 text-sm leading-6 text-slate-400">Practice is tailored to reinforce the topics and skills a student is working on.</p></div>
          </div>
          <div className="flex gap-4">
            <GraduationCap className="mt-1 shrink-0 text-emerald-300" size={22} />
            <div><h3 className="font-heading text-lg font-bold text-white">Point-wise progress reports</h3><p className="mt-1 text-sm leading-6 text-slate-400">After work is graded, parents receive clear feedback on performance and areas to revisit.</p></div>
          </div>
          <div className="flex gap-4">
            <Laptop className="mt-1 shrink-0 text-emerald-300" size={22} />
            <div><h3 className="font-heading text-lg font-bold text-white">A connected learning experience</h3><p className="mt-1 text-sm leading-6 text-slate-400">Lessons and digital resources support active participation and consistent practice.</p></div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-[radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.10),transparent_55%)]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Free trial</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">Discuss your child’s learning goals.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-300">Book a free trial to discuss curriculum, schedule, and next steps.</p>
          <Link className="apex-button-primary mt-7" to={`${ROUTES.HOME}#enquiry`}>Book a free trial <ArrowRight size={18} /></Link>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <a className="inline-flex items-center gap-2 text-slate-300 transition hover:text-amber-300" href="mailto:pratyanshrana1@gmail.com">
              <Mail size={17} aria-hidden="true" />
              pratyanshrana1@gmail.com
            </a>
            <a className="inline-flex items-center gap-2 text-slate-300 transition hover:text-amber-300" href="tel:+917302358183">
              <Phone size={17} aria-hidden="true" />
              +91 7302351838
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}