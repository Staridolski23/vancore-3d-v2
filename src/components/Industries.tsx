'use client';

import { useState } from 'react';

const industries = [
  { id: 'horeca', title: 'HoReCa', subtitle: 'Хотели, Ресторанти, Кафета', icon: '🍽️' },
  { id: 'ecommerce', title: 'E-commerce', subtitle: 'Онлайн търговия', icon: '🛒' },
  { id: 'sme', title: 'SME', subtitle: 'Малък и среден бизнес', icon: '🏢' },
  { id: 'it', title: 'IT Стартапи', subtitle: 'Технологични компании', icon: '💻' },
];

const problems: Record<string, { name: string; desc: string; level: string }[]> = {
  horeca: [
    { name: 'HR криза', desc: 'Недостиг на персонал, висока текучест', level: 'critical' },
    { name: 'Липса на дигитализация', desc: 'Ръчно управление на резервации, инвентар', level: 'critical' },
    { name: 'Слабо финансово управление', desc: 'Неправилно ценообразуване, липса на бюджетен контрол', level: 'high' },
    { name: 'Безсистемен маркетинг', desc: 'Слаб бранд, липса на онлайн присъствие', level: 'high' },
  ],
  ecommerce: [
    { name: 'Операционна неефективност', desc: 'Ръчна обработка на поръчки', level: 'critical' },
    { name: 'Логистика', desc: 'Високи разходи за доставка', level: 'critical' },
    { name: 'Слаб маркетинг', desc: 'Скъпи реклами, слаба конверсия', level: 'high' },
    { name: 'Бранд проблеми', desc: 'Несъгласуван визуален език', level: 'high' },
  ],
  sme: [
    { name: 'Липса на стратегия', desc: 'Реактивен подход, без планиране', level: 'critical' },
    { name: 'Нефективни процеси', desc: 'Ръчна работа, без автоматизация', level: 'critical' },
    { name: 'Слабо финансово управление', desc: 'Липса на бюджетен контрол', level: 'high' },
    { name: 'Безсистемен маркетинг', desc: 'Невидимост на пазара', level: 'high' },
  ],
  it: [
    { name: 'Скалиране', desc: 'От екип до организация — хаос', level: 'critical' },
    { name: 'Липса на бизнес процеси', desc: 'Технически гении, слабо управление', level: 'high' },
    { name: 'Слаб маркетинг', desc: 'Имат продукт, не знаят да го продадат', level: 'high' },
    { name: 'HR предизвикателства', desc: 'Не могат да задържат IT персонал', level: 'medium' },
  ],
};

const levelColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};
const levelLabels: Record<string, string> = { critical: 'Критичен', high: 'Висок', medium: 'Среден' };

export default function Industries() {
  const [active, setActive] = useState(0);

  return (
    <section id="проблеми" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/60 to-vancore-dark/90" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Проблеми, които решаваме</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Вашият бизнес <span className="gradient-text">губи пари</span> всеки ден</h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">80% от бизнес проблемите са универсални. Ето най-честите счупени звена, които откриваме.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {industries.map((ind, i) => (
            <button key={ind.id} onClick={() => setActive(i)} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${active === i ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark shadow-lg shadow-vancore-bronze/20' : 'glass text-vancore-muted hover:text-vancore-light'}`}>
              <span className="mr-2">{ind.icon}</span>{ind.title}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 border border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl">{industries[active].icon}</span>
              <div>
                <h3 className="text-2xl font-bold">{industries[active].title}</h3>
                <p className="text-vancore-muted text-sm">{industries[active].subtitle}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {problems[industries[active].id].map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${levelColors[p.level]} shrink-0 mt-0.5`}>{levelLabels[p.level]}</div>
                  <div>
                    <div className="text-sm font-semibold text-vancore-light">{p.name}</div>
                    <div className="text-xs text-vancore-muted mt-0.5">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-vancore-bronze/5 border border-vancore-bronze/10">
              <p className="text-sm text-vancore-muted">
                💡 <span className="text-vancore-bronze font-semibold">Решение:</span> VANCORE анализира всички аспекти на вашия бизнес и идентифицира точните точки на загуба.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
