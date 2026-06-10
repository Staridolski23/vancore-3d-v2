'use client';

import { useLanguage } from '@/hooks/useLanguage';

const stats = [
  { value: '10', labelKey: 'hero.stats.aspects' },
  { value: '3', labelKey: 'hero.stats.freeCases' },
  { value: '4', labelKey: 'hero.stats.industries' },
  { value: '24/7', labelKey: 'hero.stats.availability' },
];

export default function Hero() {
  const { messages } = useLanguage();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

  const title = t('hero.title').replace('{highlight}', '<span class="gradient-text">').replace('{/highlight}', '</span>');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-navy/40 via-vancore-dark/30 to-vancore-dark/90" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="w-2 h-2 rounded-full bg-vancore-bronze animate-pulse" />
          <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('hero.tagline')}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" dangerouslySetInnerHTML={{ __html: title }} />

        <p className="text-lg md:text-xl text-vancore-muted max-w-2xl mx-auto mb-10">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#анализ" className="group relative px-8 py-4 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-vancore-bronze/30 transition-all duration-500 hover:scale-105">
            {t('hero.ctaPrimary')}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-vancore-gold to-vancore-bronze opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </a>
          <a href="#методология" className="px-8 py-4 border border-vancore-bronze/30 text-vancore-bronze font-semibold rounded-full hover:bg-vancore-bronze/10 transition-all duration-300">
            {t('hero.ctaSecondary')}
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-vancore-muted mt-1 uppercase tracking-wider">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
