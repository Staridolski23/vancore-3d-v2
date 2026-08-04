'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

export default function Hero() {
  const { getSection } = useSiteContent();
  const section = getSection('hero');

  const title = section?.title || 'The clarity your company has been missing.';
  const subtitle = section?.subtitle || 'A boutique consultancy for the messy, internal problems — the ones org charts hide and quarterly reports can\'t reach.';

  return (
    <section className="relative bg-white min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img src="/images/hero-bg-split.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32 w-full relative z-10">
        <div className="max-w-xl">
          <div className="text-white text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — VANCORE SYSTEMS / SINCE 2020
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.08] mb-6 md:mb-8">
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
          <p className="font-sans text-base md:text-lg text-gray-200 leading-relaxed">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['EU-hosted', 'GDPR-aligned', 'AES-256', 'JWT+RBAC'].map(item => (
              <span key={item} className="px-2 py-1 rounded-full border border-white/30 bg-black/30 text-white text-[11px] font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
