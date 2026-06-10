'use client';

import { useLanguage } from '@/hooks/useLanguage';

const services = [
  {
    key: 'services.items.finance',
    title: 'Финанси',
    desc: 'Анализ на приходите, разходите и конверзията; оптимизация на маржовете.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M2 12h20M2 12l4-4m-4 4 4 4M22 12l-4-4m4 4-4 4M12 2v20" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.operations',
    title: 'Операции',
    desc: 'Автоматизация и подобряване на процесите; източване на загуби и бавни вериги.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 3v18M3 12h18M5.5 5.5l13 13" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 5.5l-13 13" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.marketing',
    title: 'Маркетинг',
    desc: 'Стратегия, дигитален маркетинг, SEO и социални медии.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.sales',
    title: 'Продажби',
    desc: 'Структуриране на функционалната и висококачествена',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M13 7h8m-8 4h8m-8 4h4M3 7h.01M3 11h.01M3 15h.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.hr',
    title: 'Човешки ресурси',
    desc: 'Набиране, onboard, обучение, ретенция и висококачествена мотивация на екипа.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.it',
    title: 'IT',
    desc: 'Дигитализация, инфраструктура, софтуерни решения.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 21h8M12 17v4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.brand',
    title: 'Бранд',
    desc: 'Идентичност, визуален език и позициониране.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.legal',
    title: 'Юридически',
    desc: 'Съответствие, договори и регулаторни изисквания.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.strategy',
    title: 'Стратегия',
    desc: 'Планиране на растежа и превръпване на бизнес действия в реални резултати.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M2 20h20M5 20V10l7-5 7 5v10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'services.items.cx',
    title: 'Клиентско изживяване',
    desc: 'Удовлетвореност, лоялност, NPS и обратна връзка.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Services() {
  const { messages } = useLanguage();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

  return (
    <section id="услуги" className="relative py-32">
      <div className="absolute inset-0 bg-vancore-dark/85" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('services.title')}</span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black mb-4"
            dangerouslySetInnerHTML={{
              __html: t('services.title').replace('{highlight}', '<span class="gradient-text">').replace('{/highlight}', '</span>'),
            }}
          />
          <p className="text-vancore-muted max-w-2xl mx-auto">{t('services.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service, i) => {
            const item = typeof service.key === 'string' ? service : { title: '', desc: '' };
            return (
              <div
                key={i}
                className="group glass rounded-2xl p-6 hover:border-vancore-bronze/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-vancore-bronze/5"
              >
                <div className="text-vancore-bronze mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
                <h3 className="font-bold text-sm mb-2 text-vancore-light">{service.title}</h3>
                <p className="text-xs text-vancore-muted leading-relaxed">{service.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <a
            href="#анализ"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-full hover:shadow-2xl hover:shadow-vancore-bronze/30 transition-all hover:scale-105"
          >
            {t('services.cta')} <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
