'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function Hero() {
  const { t } = useLanguage();
  const { getSection } = useSiteContent();
  const section = getSection('hero');

  const title = section?.title || t('hero.title');
  const subtitle = section?.subtitle || t('hero.subtitle');

  const titleHtml = title
    .replace(/<highlight>/g, '<span class="gradient-text">')
    .replace(/<\/highlight>/g, '</span>');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-navy/40 via-vancore-dark/30 to-vancore-dark-90" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="w-2 h-2 rounded-full bg-vancore-bronze animate-pulse" />
          <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('hero.tagline')}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" dangerouslySetInnerHTML={{ __html: titleHtml }} />

        <p className="text-lg md:text-xl text-vancore-muted max-w-2xl mx-auto mb-10" dangerouslySetInnerHTML={{ __html: subtitle.replace(/<highlight>/g, '<span class="gradient-text">').replace(/<\/highlight>/g, '</span>') }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {[
            { value: '10', labelKey: 'hero.stats.aspects' },
            { value: '3', labelKey: 'hero.stats.freeCases' },
            { value: '4', labelKey: 'hero.stats.industries' },
            { value: '24/7', labelKey: 'hero.stats.availability' },
          ].map((stat, i) => (
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
