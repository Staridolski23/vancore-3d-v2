'use client';

import { useState } from 'react';

const steps = [
  { number: '01', title: 'Регистрация', desc: 'Въвеждане на фирмени данни — бързо и сигурно.', icon: '🔐' },
  { number: '02', title: 'Описване на казуса', desc: 'Опишете до 3 оперативни проблема в бизнеса си.', icon: '📋' },
  { number: '03', title: 'AI Анализ', desc: 'Нашите AI агенти анализират ситуацията и изчисляват загубите.', icon: '🤖' },
  { number: '04', title: 'Конкретни решения', desc: 'Структуриран отговор с измерими резултати.', icon: '🎯' },
  { number: '05', title: 'Внедряване', desc: 'Приятелен контакт с нашия екип за реализация.', icon: '🚀' },
];

export default function Methodology() {
  const [active, setActive] = useState(0);

  return (
    <section id="методология" className="relative py-32">
      <div className="absolute inset-0 bg-vancore-dark/85" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Методология</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Концепция <span className="gradient-text">„Доминото"</span></h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">Всяка компания е верига от взаимосвързани компоненти. Ние намираме първата счупена плочка.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-6 cursor-pointer" onClick={() => setActive(i)}>
                {i < steps.length - 1 && (
                  <div className={`absolute left-6 top-14 w-px h-full bg-gradient-to-b ${i <= active ? 'from-vancore-bronze/60 to-transparent' : 'from-white/5 to-transparent'}`} />
                )}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-500 ${i <= active ? 'bg-gradient-to-br from-vancore-bronze to-vancore-gold shadow-lg shadow-vancore-bronze/30' : 'bg-vancore-navy border border-vancore-bronze/20'}`}>
                  {step.icon}
                </div>
                <div className={`pb-10 transition-all duration-500 ${i <= active ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-vancore-bronze/60">{step.number}</span>
                    <h4 className="font-bold text-vancore-light">{step.title}</h4>
                  </div>
                  <p className="text-sm text-vancore-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 max-w-lg">
            <div className="glass rounded-3xl p-8 md:p-10">
              <h3 className="text-2xl font-bold mb-2">Концепцията „Доминото"</h3>
              <p className="text-vancore-muted text-sm mb-6">Когато един елемент се счупи — всичко след него пада.</p>
              <div className="space-y-6">
                {[ 'Цялостен подход — 10 аспекта наведнъж', 'Причинно-следствени връзки', 'Приоритизиране на критични точки', 'Конкретни измерими действия' ].map((t, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-vancore-bronze/10 flex items-center justify-center shrink-0"><span className="text-vancore-bronze text-sm">{i + 1}</span></div>
                    <p className="text-sm text-vancore-muted">{t}</p>
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
