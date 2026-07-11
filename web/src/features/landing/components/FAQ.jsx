const faqs = [
  ['Which classes do you cover?', 'We provide premium live tutoring for Classes 4 through 10 (CBSE, ICSE, and British/IB curriculums).'],
  ['How do parents track progress?', 'No follow-up required. You receive automated point-wise email notifications the moment we grade any test or assignment, plus 24/7 portal access.'],
  ['Are tech bootcamps suitable for beginners?', 'Yes. Our short-term Python coding and AI prompt engineering bootcamps require zero previous programming experience.'],
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">FAQ</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white">Clear answers for parents.</h2>
      </div>
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <details className="glass-card p-5" key={question}>
            <summary className="cursor-pointer font-heading text-lg font-bold text-white">{question}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-300">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
