'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

const steps = [
  { number: '01', title: 'Discovery', desc: 'Two weeks. Stakeholder interviews, operational shadowing, document review. No deliverable theater.' },
  { number: '02', title: 'Diagnosis', desc: 'A short, brutal report. What\'s broken, what\'s working, what to leave alone.' },
  { number: '03', title: 'Design', desc: 'Co-built solutions with your team — not for them. Adoption starts here, not after launch.' },
  { number: '04', title: 'Deployment', desc: 'We stay until it sticks. Measured, iterated, owned by your people.' },
];

export default function Methodology() {
  const { getSection } = useSiteContent();
  const section = getSection('methodology');

  const title = section?.title || 'We start small, ask sharp, and listen longer.';

  return (
    <section id="методология" className="relative bg-[#050505] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-8 bg-[#991930]" />
          <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#991930]">
            — Our Method
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05]">
              {title.split(' ').map((word, i) => {
                const isItalic = ['small', 'sharp'].includes(word.toLowerCase());
                const isAccent = word.toLowerCase() === 'longer';
                return (
                  <span key={i}>
                    {isItalic ? <em className="italic">{word}</em> : isAccent ? <span className="text-[#991930]">{word}</span> : word}
                    {i < title.split(' ').length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </h2>
          </div>

          <div className="space-y-0">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6 md:gap-8 py-7 border-t border-white/5 first:border-t-0">
                <div className="text-[#991930] font-display text-xl md:text-2xl leading-none pt-0.5">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl md:text-3xl text-white mb-2">{step.title}</h3>
                  <p className="font-sans text-sm md:text-[15px] text-[#9a9a9a] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
