const faqs = [
  ['Which classes do you cover?', 'Live tutoring is available for Classes 4 through 10 across CBSE, ICSE, British, and IB curricula. UK curriculum support includes Years 6 to 8.'],
  ['How do parents track progress?', 'Parents receive point-wise email updates when a test or assignment is graded and can view reports in the portal.'],
  ['Are tech bootcamps suitable for beginners?', 'Python and AI workshops are designed for students who are new to programming.'],
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
