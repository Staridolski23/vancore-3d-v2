'use client';
import { Users, MessageCircle, Ear, Handshake } from 'lucide-react';

const team = [
  {
    name: 'Zhanet Topalova',
    role: 'Co-founder & Strategy Lead',
    focus: 'Business strategy, change enablement, client relations',
    photo: '/team/zhanet.jpg',
    linkedin: 'https://www.linkedin.com/in/zhanet-topalova/',
  },
  {
    name: 'Momchil Staridolski',
    role: 'Co-founder & Lead Analyst',
    focus: 'Operations, process re-engineering, financial diagnostics',
    photo: '/team/momchil.jpg',
    linkedin: 'https://www.linkedin.com/in/momchil-staridolski/',
  },
];

const values = [
  { title: 'Stay small', desc: 'We cap our team size to stay close to the work. No layers between the people doing the analysis and the people living with the problem.', icon: Users },
  { title: 'Ask sharp', desc: 'We don\'t do 40-question surveys. Five to seven well-placed questions reveal more than a hundred generic ones.', icon: MessageCircle },
  { title: 'Listen longer', desc: 'The first answer is rarely the real one. We stay in the room until the actual problem surfaces.', icon: Ear },
  { title: 'Leave ownership', desc: 'We don\'t build dependencies. Every engagement ends with your team owning the solution — not us.', icon: Handshake },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">

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
              <p className="font-sans text-base text-[#333] leading-relaxed">
                VANCORE was founded in 2026 by Zhanet Topalova and Momchil Staridolski. After years of working inside companies — watching good strategies fail because of internal friction, and watching small fixes create outsized impact — we decided to build a consultancy that works the way we believe consulting should work.
              </p>
              <p className="font-sans text-base text-[#333] leading-relaxed">
                We stay small by design. We take on a limited number of engagements so we can give each one the attention it deserves. We don't do slide decks that collect dust — we do work that changes how your company operates.
              </p>
              <p className="font-sans text-base text-[#333] leading-relaxed">
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
              <div key={t.name} className="border border-white/5 rounded-sm p-6 md:p-8 hover:border-[#991930]/30 transition-colors">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#991930]/30">
                  <img src={t.photo} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 className="font-display text-2xl text-white mb-1">{t.name}</h3>
                <div className="text-[#991930] text-sm font-sans mb-3">{t.role}</div>
                <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed mb-4">{t.focus}</p>
                {t.linkedin && (
                  <a href={t.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#9a9a9a] hover:text-[#991930] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                )}
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
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="card-hover border border-[#e5e5e5] rounded-sm p-6 cursor-pointer">
                  <Icon className="w-6 h-6 text-[#991930] mb-3" strokeWidth={1.5} />
                  <h3 className="font-display text-xl text-[#111] mb-2">{v.title}</h3>
                  <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Want to work with us?</h2>
          <p className="font-sans text-base text-[#6b6b6b] mb-8 max-w-md mx-auto">
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
