const faqs = [
  ['Which classes do you cover?', 'SmartChalk currently provides premium, subject-specific learning plans exclusively for Classes 4 to 10.'],
  ['How do parents track progress?', 'Transparency is our guarantee. Parents get role-based access to our platform, providing complete visibility into assignment completion, class performance, and grade improvements.'],
  ['Are the tech bootcamps suitable for beginners?', 'Absolutely. Our Python and AI summer courses are designed from the ground up for absolute beginners, focusing on making complex concepts accessible and fun.'],
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
