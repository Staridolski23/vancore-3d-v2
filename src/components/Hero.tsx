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
            <div className="aspect-[4/3] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-sm overflow-hidden relative">
              {/* Abstract business visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Network nodes */}
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#991930] rounded-full animate-pulse" />
                  <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-[#991930]/60 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                  <div className="absolute top-1/2 left-3/4 w-4 h-4 bg-[#991930]/40 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                  <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-[#991930]/80 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
                  <div className="absolute top-3/4 left-2/3 w-3 h-3 bg-[#991930]/50 rounded-full animate-pulse" style={{animationDelay: '0.7s'}} />
                  
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                    <line x1="100" y1="75" x2="200" y2="100" stroke="#991930" strokeWidth="1" opacity="0.3" />
                    <line x1="200" y1="100" x2="300" y2="150" stroke="#991930" strokeWidth="1" opacity="0.2" />
                    <line x1="300" y1="150" x2="150" y2="200" stroke="#991930" strokeWidth="1" opacity="0.3" />
                    <line x1="150" y1="200" x2="280" y2="225" stroke="#991930" strokeWidth="1" opacity="0.2" />
                    <line x1="100" y1="75" x2="150" y2="200" stroke="#991930" strokeWidth="1" opacity="0.15" />
                    <line x1="200" y1="100" x2="280" y2="225" stroke="#991930" strokeWidth="1" opacity="0.25" />
                  </svg>
                  
                  {/* Central element */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-24 h-24 border border-[#991930]/30 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 border border-[#991930]/50 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-[#991930] rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
