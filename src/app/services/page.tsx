'use client';

import Header from '@/components/Header';

const practices = [
  {
    number: '01',
    title: 'Business Analysis',
    desc: 'We map your operations, identify bottlenecks, and quantify the cost of inaction. Stakeholder interviews, process mapping, and data review — no deliverable theater.',
  },
  {
    number: '02',
    title: 'Process Re-engineering',
    desc: 'We redesign workflows that have outlived their purpose. From order-to-cash to hire-to-retire — we simplify, automate, and document.',
  },
  {
    number: '03',
    title: 'AI-Powered Diagnostics',
    desc: 'Our proprietary analyzer runs financial, tax, HR, operations, legal, and marketing diagnostics in minutes. Human consultants interpret and contextualize.',
  },
  {
    number: '04',
    title: 'Change Enablement',
    desc: 'Solutions fail when people don\'t adopt them. We co-build with your team, train for ownership, and stay until it sticks.',
  },
];

const industries = [
  { name: 'Hospitality & F&B', detail: 'Hotels, restaurants, and food service — where operational friction hides behind guest-facing perfection.' },
  { name: 'Commerce', detail: 'E-commerce and retail — where returns, support overload, and messy order flows silently drain margin.' },
  { name: 'SME', detail: 'Small and medium enterprises — where founders carry knowledge that never makes it into process or tooling.' },
  { name: 'Technology', detail: 'SaaS and tech companies — where delivery pressure can outpace communication and alignment.' },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — SERVICES
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            Four practices. One outcome.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            We help companies see clearly through their internal complexity — and act on what they find. Every engagement follows the same four-stage method, adapted to your context.
          </p>
        </div>
      </section>

      {/* Practices */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {practices.map((p) => (
              <div key={p.number} className="border border-[#e5e5e5] rounded-sm p-6 md:p-8 hover:border-[#991930]/40 transition-colors">
                <div className="text-[#991930] font-display text-sm mb-3">{p.number}</div>
                <h3 className="font-display text-xl md:text-2xl text-[#111] mb-3">{p.title}</h3>
                <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Method reminder */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-[#991930]" />
            <span className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-[#991930]">
              — OUR METHOD
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <h2 className="font-display text-4xl md:text-5xl text-white leading-[1.05]">
              We start small, ask sharp, and listen longer.
            </h2>
            <div className="space-y-0">
              {[
                { n: '01', t: 'Discovery', d: 'Two weeks. Stakeholder interviews, operational shadowing, document review.' },
                { n: '02', t: 'Diagnosis', d: 'A short, brutal report. What\'s broken, what\'s working, what to leave alone.' },
                { n: '03', t: 'Design', d: 'Co-built solutions with your team — not for them. Adoption starts here.' },
                { n: '04', t: 'Deployment', d: 'We stay until it sticks. Measured, iterated, owned by your people.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 md:gap-8 py-7 border-t border-white/5 first:border-t-0">
                  <div className="text-[#991930] font-display text-xl md:text-2xl leading-none pt-0.5">{s.n}</div>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl md:text-3xl text-white mb-2">{s.t}</h3>
                    <p className="font-sans text-sm md:text-[15px] text-[#9a9a9a] leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
            — INDUSTRIES
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.08] mb-10">Where we show up</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {industries.map((ind) => (
              <div key={ind.name} className="border border-[#e5e5e5] rounded-sm p-5">
                <div className="text-[#991930] font-display text-sm mb-2">{ind.name}</div>
                <p className="text-xs text-[#6b6b6b] leading-relaxed">{ind.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Ready to see clearly?</h2>
          <p className="font-sans text-sm text-[#6b6b6b] mb-8 max-w-md mx-auto">
            Book a short call and we'll tell you honestly whether we can help.
          </p>
          <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#991930] text-white text-sm font-sans font-medium btn-hover">
            Book a call
          </a>
        </div>
      </section>

    </main>
  );
}
