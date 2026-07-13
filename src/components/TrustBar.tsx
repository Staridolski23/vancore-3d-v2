'use client';

import { useState } from 'react';

const logos = [
  'VANCORE',
  'Meridian Hotels',
  'Nordic Logistics',
  'Atlas Retail',
  'Prism SaaS',
  'Fortress Hospitality',
  'Oak Commerce',
  'CoreOps Technology',
];

export default function TrustBar() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="border-t border-[#e5e5e5] bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-left text-[10px] font-sans font-semibold tracking-[0.18em] text-[#6b6b6b] uppercase mb-4">
          Trusted by operators across industries
        </p>
        <div className="relative overflow-hidden">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="flex w-full"
          >
            <div
              className={`flex min-w-full items-center justify-between gap-8 text-sm font-sans text-[#6b6b6b]/80 ${paused ? '' : 'animate-marquee'}`}
              style={{ animationDuration: '28s' }}
            >
              {[...logos, ...logos].map((name, i) => (
                <span key={i} className="whitespace-nowrap border border-[#e5e5e5] rounded-sm px-4 py-2 bg-[#f7f6f2]">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
