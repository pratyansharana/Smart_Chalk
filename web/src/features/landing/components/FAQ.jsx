const faqs = [
  ['Which classes are covered?', 'Apex Tutors currently supports Classes 4 to 10 with subject-specific learning plans.'],
  ['How do parents track progress?', 'Parents get transparent assignment, class, and grade visibility as the platform phases expand.'],
  ['Is the 3D experience required?', 'No. The landing page detects reduced-motion preferences and falls back to a static premium gradient.'],
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
