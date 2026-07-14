'use client';
import { Hotel, ShoppingCart, Cpu, Truck, ArrowRight } from 'lucide-react';

const cases = [
  {
    id: 1,
    client: 'Coastal Hotel Group',
    industry: 'HoReCa',
    icon: Hotel,
    color: '#991930',
    problem: 'A 120-room hotel with 40 housekeeping staff was losing guests due to slow room turnover. Rooms weren\'t ready by check-in time, complaints were piling up, and the team was overwhelmed with manual coordination.',
    approach: 'We mapped the entire housekeeping workflow — from checkout to clean room ready. Identified 3 major bottlenecks: room assignment delays, supply restocking gaps, and shift handoff inefficiencies. Redesigned the process with a digital task board, optimized staff routing by floor zones, and introduced a real-time status dashboard for supervisors.',
    result: 'Room turnover time dropped from 45 minutes to 31 minutes — a 31% efficiency increase. Guest satisfaction scores rose by 18 points. The hotel saved €42,000 annually in overtime costs.',
    metrics: [
      { label: 'Efficiency gain', value: '+31%' },
      { label: 'Guest satisfaction', value: '+18pts' },
      { label: 'Annual savings', value: '€42K' },
    ],
  },
  {
    id: 2,
    client: 'Metro Retail',
    industry: 'E-commerce',
    icon: ShoppingCart,
    color: '#22c55e',
    problem: 'A growing online fashion retailer was processing 500+ orders daily with a support team of just 3 people. 60% of all support tickets were repetitive — "Where is my order?", "How do I return?", "What\'s my size?". The team had no time for anything else.',
    approach: 'We analyzed 3 months of support data and identified the top 10 recurring questions. Built a self-service portal with order tracking, automated return labels, and an AI chatbot trained on their specific product catalog. Integrated everything with their existing Shopify store.',
    result: 'Support ticket volume dropped 24% within 8 weeks. The team redirected 15 hours per week from repetitive tasks to proactive customer engagement. First-contact resolution rate improved from 45% to 78%.',
    metrics: [
      { label: 'Fewer tickets', value: '-24%' },
      { label: 'Time saved', value: '15h/week' },
      { label: 'Resolution rate', value: '78%' },
    ],
  },
  {
    id: 3,
    client: 'B2B SaaS Platform',
    industry: 'Technology',
    icon: Cpu,
    color: '#991930',
    problem: 'A SaaS company with 15 employees and €2M ARR had a critical problem: the founder was the only one who knew where every deal stood. Sales reps couldn\'t forecast, the board had no visibility, and deals were slipping through the cracks because nothing was documented.',
    approach: 'We audited their entire sales process and found that 40% of leads had no follow-up after the first call. We rebuilt their CRM pipeline with clear stages, automated follow-up triggers, and a weekly reporting cadence. Trained the team on the new process and set up a real-time dashboard for leadership.',
    result: 'Pipeline visibility went from 0% to 100%. The sales cycle shortened by 12 days on average. The board now gets a weekly snapshot without asking the founder. Revenue forecasting accuracy improved to ±8%.',
    metrics: [
      { label: 'Pipeline visibility', value: '100%' },
      { label: 'Sales cycle', value: '-12 days' },
      { label: 'Forecast accuracy', value: '±8%' },
    ],
  },
  {
    id: 4,
    client: 'Regional Logistics',
    industry: 'Logistics',
    icon: Truck,
    color: '#991930',
    problem: 'A logistics company with 30 vehicles was struggling with delivery scheduling chaos. Customers waited up to 2 hours for deliveries, drivers were colliding on the same routes, and fuel costs were climbing. The founder was spending 3 hours a day just coordinating schedules on the phone.',
    approach: 'We analyzed 6 months of delivery data and identified route overlaps, time-window inefficiencies, and driver utilization gaps. Implemented an intelligent scheduling algorithm that optimizes routes in real-time, balances driver workloads, and provides customers with accurate 30-minute delivery windows.',
    result: 'Average customer wait time dropped from 2 hours to 20 minutes. Fuel costs decreased by 18%. The founder reclaimed 3 hours per day. On-time delivery rate improved from 72% to 96%.',
    metrics: [
      { label: 'Wait time', value: '2h → 20min' },
      { label: 'Fuel savings', value: '-18%' },
      { label: 'On-time delivery', value: '96%' },
    ],
  },
];

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">

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
            Real cases. Real results. Every engagement starts with understanding the problem and ends with measurable change.
          </p>
        </div>
      </section>

      {/* Cases */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-16">
            {cases.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div key={c.id} className="border border-white/5 rounded-sm overflow-hidden">
                  {/* Case Header */}
                  <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                        <Icon className="w-6 h-6" style={{ color: c.color }} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase">
                          {c.industry}
                        </div>
                        <h3 className="font-display text-2xl md:text-3xl text-white">{c.client}</h3>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {c.metrics.map((m) => (
                        <div key={m.label} className="text-center px-3 py-2 bg-white/5 rounded-sm">
                          <div className="font-display text-lg text-white">{m.value}</div>
                          <div className="text-[10px] font-sans text-[#6b6b6b] uppercase tracking-wider">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Case Content */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Problem */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-xs font-sans font-semibold tracking-[0.15em] uppercase text-red-400">The Problem</span>
                      </div>
                      <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{c.problem}</p>
                    </div>

                    {/* Approach */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#991930]" />
                        <span className="text-xs font-sans font-semibold tracking-[0.15em] uppercase text-[#991930]">What We Did</span>
                      </div>
                      <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{c.approach}</p>
                    </div>

                    {/* Result */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs font-sans font-semibold tracking-[0.15em] uppercase text-green-400">The Result</span>
                      </div>
                      <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{c.result}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
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
            <div className="space-y-0">
              {[
                { n: '01', t: 'Discovery', d: 'Two weeks of stakeholder interviews, operational shadowing, and document review. We listen before we speak.' },
                { n: '02', t: 'Diagnosis', d: 'A short, brutal report. What\'s broken, what\'s working, what to leave alone. No fluff.' },
                { n: '03', t: 'Design', d: 'Co-built solutions with your team — not for them. Adoption starts here, not after launch.' },
                { n: '04', t: 'Deployment', d: 'We stay until it sticks. Measured, iterated, owned by your people.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 md:gap-8 py-7 border-t border-[#e5e5e5] first:border-t-0">
                  <div className="text-[#991930] font-display text-xl md:text-2xl leading-none pt-0.5">{s.n}</div>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl text-[#111] mb-2">{s.t}</h3>
                    <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            See what we can do for your business.
          </h2>
          <p className="font-sans text-base text-[#9a9a9a] mb-8 max-w-lg mx-auto">
            Every business has hidden inefficiencies. Let's find yours — and fix them.
          </p>
          <a
            href="/contact"
            className="btn-hover inline-flex items-center gap-2 px-8 py-4 bg-[#991930] text-white text-sm font-sans font-medium"
          >
            Get your free assessment
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
