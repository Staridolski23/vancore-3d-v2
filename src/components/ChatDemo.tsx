'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

type CaseExample = {
  problem: string;
  analysis: string;
  cost: string;
};

const caseExamples: Record<string, CaseExample[]> = {
  bg: [
    { problem: 'Ресторант в София губи 30% от персонала всяка година', analysis: 'Тясно гърло: липсва система за онбординг + ниска мотивация', cost: 'Загуба: ~8 000 EUR/година за набиране и обучение' },
    { problem: 'E-commerce фирма обработва 500 поръчки/месец, но има 15% грешки', analysis: 'Тясно гърло: ръчна обработка + липса на инвентарна система', cost: 'Загуба: ~2 500 EUR/месец в възстановки и загубени клиенти' },
    { problem: 'IT стартап губи продуктивност при комуникация и задачи', analysis: 'Тясно гърло: липсва централизирана система за задачи и комуникация', cost: 'Загуба: ~120 часа/месец в излишни срещи и дублиране' },
  ],
  en: [
    { problem: 'A Sofia restaurant loses 30% of its staff every year', analysis: 'Bottleneck: no onboarding system and low motivation', cost: 'Loss: ~8,000 EUR/year from hiring and training' },
    { problem: 'E-commerce brand handles 500 orders/month with 15% errors', analysis: 'Bottleneck: manual order handling and missing inventory control', cost: 'Loss: ~2,500 EUR/month in refunds and lost customers' },
    { problem: 'An IT startup loses productivity from poor task and communication flow', analysis: 'Bottleneck: no central task and communication system', cost: 'Loss: ~120 hours/month in extra meetings and duplication' },
  ],
};

export default function ChatDemo() {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const { locale, messages } = useLanguage();

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    const template = typeof value === 'string' ? value : key;
    if (!params) return template;
    return String(template).replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  };

  const examples = caseExamples[locale] || caseExamples.bg;

  return (
    <section id="анализ" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/40 to-vancore-dark/90" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-vancore-bronze/3 rounded-full blur-[220px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('analysis.badge')}</span>
          </div>
          <p className="text-vancore-muted max-w-2xl mx-auto">{t('analysis.subtitle')}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">{t('analysis.agentLabel')}</span>
            </div>

            <div className="p-6 min-h-[280px]">
              {!submitted ? (
                <>
                  <div className="mb-6">
                    <p className="text-xs text-vancore-muted mb-3">{t('analysis.examplesLabel')}</p>
                    <div className="flex flex-wrap gap-2">
                      {examples.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setInput(c.problem); setCaseIndex(idx); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-vancore-bronze/10 text-vancore-bronze border border-vancore-bronze/20 hover:bg-vancore-bronze/20 transition-colors"
                        >
                          {t('analysis.caseLabel', { n: idx + 1 })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-sm shrink-0" />
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 max-w-md">
                      <p className="text-sm text-vancore-muted">{t('analysis.intro')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t('analysis.placeholder')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-vancore-light focus:outline-none focus:border-vancore-bronze/40 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && input.trim() && setSubmitted(true)}
                    />
                    <button
                      onClick={() => input.trim() && setSubmitted(true)}
                      disabled={!input.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all"
                    >
                      {t('analysis.submit')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3 justify-end mb-4">
                    <div className="bg-vancore-bronze/20 rounded-2xl rounded-tr-sm p-4 max-w-md"><p className="text-sm">{input}</p></div>
                  </div>
                  {[t('analysis.result.analysis'), t('analysis.result.financialImpact'), t('analysis.result.solutions')].map((title, i) => {
                    const fields = ['analysis', 'cost', 'problem'] as const;
                    const bgClass = i === 0 ? 'bg-white/5' : i === 1 ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20';
                    const titleClass = i === 0 ? 'text-vancore-bronze' : i === 1 ? 'text-red-400' : 'text-green-400';
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-sm shrink-0" />
                        <div className={`flex-1 rounded-2xl rounded-tl-sm p-4 ${bgClass}`}>
                          <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${titleClass}`}>{title}</div>
                          <p className="text-sm text-vancore-muted">{examples[caseIndex][fields[i]]}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <a href="#контакт" className="px-6 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-xl hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all text-center">{t('analysis.cta')}</a>
                    <span className="text-xs text-vancore-muted">{t('analysis.ctaHint')}</span>
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
