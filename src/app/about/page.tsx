'use client';

import Header from '@/components/Header';

const team = [
  {
    name: 'Zhanet Topalova',
    role: 'Co-founder & Strategy Lead',
    focus: 'Business strategy, change enablement, client relations',
    photo: '/team/zhanet.jpg',
  },
  {
    name: 'Momchil Staridolski',
    role: 'Co-founder & Lead Analyst',
    focus: 'Operations, process re-engineering, financial diagnostics',
    photo: '/team/momchil.jpg',
  },
];

const values = [
  { title: 'Stay small', desc: 'We cap our team size to stay close to the work. No layers between the people doing the analysis and the people living with the problem.' },
  { title: 'Ask sharp', desc: 'We don\'t do 40-question surveys. Five to seven well-placed questions reveal more than a hundred generic ones.' },
  { title: 'Listen longer', desc: 'The first answer is rarely the real one. We stay in the room until the actual problem surfaces.' },
  { title: 'Leave ownership', desc: 'We don\'t build dependencies. Every engagement ends with your team owning the solution — not us.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — ABOUT
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            A <span className="text-[#991930]">boutique business</span> analysis &amp; development consultancy.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            We help companies see clearly through their internal complexity — and act on what they find. Operating at the intersection of operations, technology, and people.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-[#111] leading-[1.08] mb-6">
                Why we exist.
              </h2>
            </div>
            <div className="space-y-5">
              <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">
                VANCORE was founded in 2026 by Zhanet Topalova and Momchil Staridolski. After years of working inside companies — watching good strategies fail because of internal friction, and watching small fixes create outsized impact — we decided to build a consultancy that works the way we believe consulting should work.
              </p>
              <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">
                We stay small by design. We take on a limited number of engagements so we can give each one the attention it deserves. We don't do slide decks that collect dust — we do work that changes how your company operates.
              </p>
              <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">
                Our name comes from "Vantage and Core" — the perspective you need and the center of the problem. That's what we bring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
            — TEAM
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-[1.08] mb-12">The people behind VANCORE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((t) => (
              <div key={t.name} className="border border-white/5 rounded-sm p-6 md:p-8">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-[#991930]/30">
                  <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-display text-xl text-white mb-1">{t.name}</h3>
                <div className="text-[#991930] text-sm font-sans mb-3">{t.role}</div>
                <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{t.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
            — VALUES
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.08] mb-10">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {values.map((v) => (
              <div key={v.title} className="border border-[#e5e5e5] rounded-sm p-6">
                <h3 className="font-display text-xl text-[#111] mb-2">{v.title}</h3>
                <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Want to work with us?</h2>
          <p className="font-sans text-sm text-[#6b6b6b] mb-8 max-w-md mx-auto">
            We'd rather tell you honestly if we're not the right fit than waste your time.
          </p>
          <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#991930] text-white text-sm font-sans font-medium btn-hover">
            Get in touch
          </a>
        </div>
      </section>

    </main>
  );
}
