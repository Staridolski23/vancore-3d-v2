'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const industries = [
  { id: 'horeca', labelKey: 'industries.horeca.title' },
  { id: 'ecommerce', labelKey: 'industries.ecommerce.title' },
  { id: 'sme', labelKey: 'industries.sme.title' },
  { id: 'it', labelKey: 'industries.it.title' },
];

type Level = 'critical' | 'high' | 'medium';

type Problem = { name: string; desc: string; level: Level };

const levelConfig: Record<Level, { color: string; labelKey: string }> = {
  critical: { color: 'bg-red-500/15 text-red-300 border-red-500/25', labelKey: 'levels.critical' },
  high: { color: 'bg-orange-500/15 text-orange-300 border-orange-500/25', labelKey: 'levels.high' },
  medium: { color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25', labelKey: 'levels.medium' },
};

const problems: Record<string, Problem[]> = {
  horeca: [
    { name: 'HR криза', desc: 'Недостиг на персонал, висока текучество', level: 'critical' },
    { name: 'Липса на дигитализация', desc: 'Ръчно управление на резервации и инвентар', level: 'critical' },
    { name: 'Слабо финансово управление', desc: 'Неправилно ценообразуване, липса на бюджетен контрол', level: 'high' },
    { name: 'Безсистемен маркетинг', desc: 'Слаб бранд, липса на онлайн присъствие', level: 'high' },
  ],
  ecommerce: [
    { name: 'Операционна неефективност', desc: 'Ръчна обработка на поръчки', level: 'critical' },
    { name: 'Логистика', desc: 'Високи разходи за доставка', level: 'critical' },
    { name: 'Слаб маркетинг', desc: 'Скъпи реклами, слаба конверсия', level: 'high' },
    { name: 'Бранд проблеми', desc: 'Несъгласуван визуален език и тон', level: 'high' },
  ],
  sme: [
    { name: 'Липса на стратегия', desc: 'Реактивен подход, без планиране', level: 'critical' },
    { name: 'Нефективни процеси', desc: 'Ръчна работа, без автоматизация', level: 'critical' },
    { name: 'Слабо финансово управление', desc: 'Липса на бюджетен контрол и прогнози', level: 'high' },
    { name: 'Невидимост на пазара', desc: 'Безсистемен маркетинг и слабо позициониране', level: 'high' },
  ],
  it: [
    { name: 'Скалиране', desc: 'От екип до организация — хаос и пропуски', level: 'critical' },
    { name: 'Липса на управление', desc: 'Технически гении, слаб процесен контрол', level: 'high' },
    { name: 'Слаб пазарен подход', desc: 'Силна технология, слаба продажна история', level: 'high' },
    { name: 'HR предизвикателства', desc: 'Трудно задържане на关键技术 персонал', level: 'medium' },
  ],
};

export default function Industries() {
  const [active, setActive] = useState(0);
  const { messages } = useLanguage();
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

  return (
    <section id="проблеми" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/60 to-vancore-dark/90" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('industries.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t('industries.title.prefix')} <span className="gradient-text">{t('industries.title.accent')}</span> {t('industries.title.suffix')}
          </h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">{t('industries.subtitle')}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {industries.map((ind, i) => {
            const label = t(ind.labelKey);
            return (
              <button
                key={ind.id}
                onClick={() => setActive(i)}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  active === i
                    ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark shadow-lg shadow-vancore-bronze/20'
                    : 'glass text-vancore-muted hover:text-vancore-light'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 border border-white/5">
            <h3 className="text-2xl font-bold mb-6">{t(industries[active].labelKey)}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {problems[industries[active].id].map((p, i) => {
                const config = levelConfig[p.level];
                return (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 mt-0.5 ${config.color}`}>{t(config.labelKey)}</span>
                    <div>
                      <div className="text-sm font-semibold text-vancore-light">{p.name}</div>
                      <div className="text-xs text-vancore-muted mt-0.5">{p.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-vancore-bronze/5 border border-vancore-bronze/10">
              <p className="text-sm text-vancore-muted">{t('industries.solutionLabel')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
