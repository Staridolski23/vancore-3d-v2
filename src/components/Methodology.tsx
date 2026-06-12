'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const steps = [
  { number: '01', titleKey: 'methodology.steps.0.title', descKey: 'methodology.steps.0.desc' },
  { number: '02', titleKey: 'methodology.steps.1.title', descKey: 'methodology.steps.1.desc' },
  { number: '03', titleKey: 'methodology.steps.2.title', descKey: 'methodology.steps.2.desc' },
  { number: '04', titleKey: 'methodology.steps.3.title', descKey: 'methodology.steps.3.desc' },
  { number: '05', titleKey: 'methodology.steps.4.title', descKey: 'methodology.steps.4.desc' },
];

export default function Methodology() {
  const [active, setActive] = useState(0);
  const { t } = useLanguage();

  const pillarsValue = t('methodology.pillars');

  const pillars = Array.isArray(pillarsValue)
    ? pillarsValue
    : [
        'Първо анализираме всички бизнес процеси и намираме „счупените звена“.',
        'След това проектираме решение, което да улесни операцията и да спести ресурси.',
        'Наблягаме на измерим ефект: печалба, време, стабилност.',
        'Внедряваме промените стъпка по стъпка и измерваме резултата.',
        'Поддържаме процеса, за да се запази доминото в движение.',
      ];

  const title = t('methodology.title')
    .replace('{highlight}', '<span class="gradient-text">')
    .replace('{/highlight}', '</span>');

  return (
    <section id="методология" className="relative py-32">
      <div className="absolute inset-0 bg-vancore-dark/85" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Методология</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="text-vancore-muted max-w-2xl mx-auto">{t('methodology.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-6 cursor-pointer" onClick={() => setActive(i)}>
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-6 top-14 w-px h-full bg-gradient-to-b ${
                      i <= active ? 'from-vancore-bronze/60 to-transparent' : 'from-white/5 to-transparent'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-500 ${
                    i <= active ? 'bg-gradient-to-br from-vancore-bronze to-vancore-gold shadow-lg shadow-vancore-bronze/30' : 'bg-vancore-navy border border-vancore-bronze/20'
                  }`}
                >
                  {i + 1}
                </div>
                <div className={`pb-10 transition-all duration-500 ${i <= active ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-vancore-bronze/60">{step.number}</span>
                    <h4 className="font-bold text-vancore-light">{t(step.titleKey)}</h4>
                  </div>
                  <p className="text-sm text-vancore-muted leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 max-w-lg">
            <div className="glass rounded-3xl p-8 md:p-10">
              <h3 className="text-2xl font-bold mb-2">{t('methodology.conceptTitle')}</h3>
              <p className="text-vancore-muted text-sm mb-6">{t('methodology.conceptSubtitle')}</p>
              <div className="space-y-6">
                {pillars.map((item: string, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-vancore-bronze/10 flex items-center justify-center shrink-0">
                      <span className="text-vancore-bronze text-sm">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-vancore-muted">{item as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
