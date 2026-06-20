'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

export default function Hero() {
  const { getSection } = useSiteContent();
  const section = getSection('hero');

  const title = section?.title || 'The clarity your company has been missing.';
  const subtitle = section?.subtitle || 'A husband-and-wife consultancy for the messy, internal problems — the ones org charts hide and quarterly reports can\'t reach.';

  return (
    <section className="relative bg-white min-h-screen flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
              — VANCORE SYSTEMS / EST. 2026
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-8">
              {title.split(' ').map((word, i) => {
                const accentWords = ['missing.'];
                return (
                  <span key={i}>
                    {accentWords.includes(word) ? (
                      <span className="text-[#991930]">{word}</span>
                    ) : (
                      word
                    )}
                    {i < title.split(' ').length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </h1>
            <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] bg-[#e5e5e5] rounded-sm overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                alt="Modern conference room"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] font-sans font-medium tracking-wider text-[#111]">
                VS / 2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
