'use client';

import Header from '@/components/Header';

const cases = [
  {
    client: 'Coastal Hotel Group',
    industry: 'Hospitality',
    result: 'Housekeeping efficiency +31% in 6 weeks',
    detail: 'We mapped the housekeeping workflow, identified scheduling bottlenecks, and redesigned the room assignment process. The result was a 31% efficiency gain in the first six weeks.',
  },
  {
    client: 'Metro Retail',
    industry: 'E-commerce',
    result: 'Support tickets down 24%',
    detail: 'By analyzing support ticket patterns, we identified the top 5 recurring issues and built self-service resolutions. Support ticket volume dropped 24% within two months.',
  },
  {
    client: 'B2B SaaS Platform',
    industry: 'Technology',
    result: 'Pipeline visibility restored for leadership',
    detail: 'Sales leadership had no clear view of deal progression. We rebuilt the CRM pipeline stages, trained the team, and created a weekly reporting cadence.',
  },
  {
    client: 'Regional Logistics',
    industry: 'Logistics',
    result: '20min instead of 2 hours waiting',
    detail: 'Delivery scheduling was creating 2-hour wait times. We analyzed routes, optimized distribution, and implemented intelligent scheduling, reducing average wait to 20 minutes.',
  },
];

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — WORK
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            Selected work.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            A small sample of engagements. Each one started with a conversation and ended with measurable change.
          </p>
        </div>
      </section>

      {/* Cases */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="divide-y divide-white/5">
            {cases.map((c) => (
              <div key={c.client} className="py-10 md:py-14 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="md:max-w-md">
                  <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-2">
                    {c.industry}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl text-white mb-3">{c.client}</h3>
                  <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{c.detail}</p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#6b6b6b] mb-2">
                    Result
                  </div>
                  <div className="font-display text-xl md:text-2xl text-white">{c.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process reminder */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
                — PROCESS
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05]">
                How we work.
              </h2>
            </div>
            <div className="space-y-6">
              {[
                { n: '01', t: 'Discovery', d: 'Two weeks of stakeholder interviews, operational shadowing, and document review. No deliverable theater.' },
                { n: '02', t: 'Diagnosis', d: 'A short, brutal report. What\'s broken, what\'s working, what to leave alone.' },
                { n: '03', t: 'Design', d: 'Co-built solutions with your team — not for them. Adoption starts here, not after launch.' },
                { n: '04', t: 'Deployment', d: 'We stay until it sticks. Measured, iterated, owned by your people.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6">
                  <div className="text-[#991930] font-display text-lg leading-none pt-0.5">{s.n}</div>
                  <div>
                    <h3 className="font-display text-xl text-[#111] mb-1">{s.t}</h3>
                    <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Have a problem worth solving?</h2>
          <p className="font-sans text-sm text-[#6b6b6b] mb-8 max-w-md mx-auto">
            We take on a limited number of engagements at a time. If the fit is right, we'll tell you.
          </p>
          <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#991930] text-white text-sm font-sans font-medium btn-hover">
            Start a conversation
          </a>
        </div>
      </section>

    </main>
  );
}
