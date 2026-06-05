'use client';

import { useState } from 'react';

const caseExamples = [
  { id: 1, problem: 'Ресторан в София губи 30% от персонала всяка година', analysis: 'Тясно гърло: Липсва система за онбординг + ниска мотивация', cost: 'Загуба: ~8,000 EUR/година за набиране и обучение' },
  { id: 2, problem: 'E-commerce фирма обработва 500 поръчки/месец, но има 15% грешки', analysis: 'Тясно гърло: Ръчна обработка + липса на инвентарна система', cost: 'Загуба: ~2,500 EUR/месец в възстановки и загубени клиенти' },
  { id: 3, problem: 'IT стартап губи продуктивност при комуникация и задачи', analysis: 'Тясно гърло: Липсва централизирана система за комуникация', cost: 'Загуба: ~120 часа/месец в излишни срещи и дублиране' },
];

export default function ChatDemo() {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);

  return (
    <section id="анализ" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/40 to-vancore-dark/90" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-vancore-bronze/3 rounded-full blur-[220px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Безплатен AI анализ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Тествайте <span className="gradient-text">на живо</span></h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">Опишете проблема си и нашите AI агенти ще го анализират в реално време.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">VANCORE AI Агент — Старши Бизнес Анализатор</span>
            </div>

            <div className="p-6 min-h-[280px]">
              {!submitted ? (
                <>
                  <div className="mb-6">
                    <p className="text-xs text-vancore-muted mb-3">Примерни казуси (кликни за да попълниш):</p>
                    <div className="flex flex-wrap gap-2">
                      {caseExamples.map((c) => (
                        <button key={c.id} onClick={() => { setInput(c.problem); setCaseIndex(c.id - 1); }} className="text-xs px-3 py-1.5 rounded-full bg-vancore-bronze/10 text-vancore-bronze border border-vancore-bronze/20 hover:bg-vancore-bronze/20 transition-colors">Казус #{c.id}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-sm shrink-0">🤖</div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 max-w-md">
                      <p className="text-sm text-vancore-muted">Здравейте! Аз съм Вашият AI бизнес анализатор. Опишете оперативен проблем, с който се сблъсквате, и ще го анализирам веднага.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Опишете проблема си тук..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-vancore-light focus:outline-none focus:border-vancore-bronze/40 transition-colors" onKeyDown={(e) => e.key === 'Enter' && input.trim() && setSubmitted(true)} />
                    <button onClick={() => input.trim() && setSubmitted(true)} disabled={!input.trim()} className="px-6 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all">Анализирай</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3 justify-end mb-4">
                    <div className="bg-vancore-bronze/20 rounded-2xl rounded-tr-sm p-4 max-w-md"><p className="text-sm">{input}</p></div>
                  </div>
                  {['Анализ на ситуацията', '💰 Финансово изражение', '✅ Технологични решения'].map((title, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-sm shrink-0">🤖</div>
                      <div className={`flex-1 rounded-2xl rounded-tl-sm p-4 ${i === 0 ? 'bg-white/5' : i === 1 ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                        <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${i === 0 ? 'text-vancore-bronze' : i === 1 ? 'text-red-400' : 'text-green-400'}`}>{title}</div>
                        <p className="text-sm text-vancore-muted">{caseExamples[caseIndex][i === 0 ? 'analysis' : i === 1 ? 'cost' : 'problem']}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <a href="#контакт" className="px-6 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-xl hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all text-center">Свържете се с нашия екип</a>
                    <span className="text-xs text-vancore-muted">Започнете реално внедряване сега</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
