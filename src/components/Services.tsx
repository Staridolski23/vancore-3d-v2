'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { useSiteContent } from '@/hooks/useSiteContent';

const services = [
  { title: 'Финанси', desc: 'Анализ на приходите, разходите и конверзията; оптимизация на маржовете.', icon: '💰' },
  { title: 'Операции', desc: 'Автоматизация и подобряване на процесите; източване на загуби и бавни вериги.', icon: '⚙️' },
  { title: 'Маркетинг', desc: 'Стратегия, дигитален маркетинг, SEO и социални медии.', icon: '📣' },
  { title: 'Продажби', desc: 'Структуриране на функционалната и висококачествена продажна машина.', icon: '📈' },
  { title: 'Човешки ресурси', desc: 'Набиране, onboard, обучение, ретенция и мотивация на екипа.', icon: '👥' },
  { title: 'IT', desc: 'Дигитализация, инфраструктура, софтуерни решения.', icon: '💻' },
  { title: 'Бранд', desc: 'Идентичност, визуален език и позициониране.', icon: '⭐' },
  { title: 'Юридически', desc: 'Съответствие, договори и регулаторни изисквания.', icon: '⚖️' },
  { title: 'Стратегия', desc: 'Планиране на растежа и превръщане на действия в резултати.', icon: '🎯' },
  { title: 'Клиентско изживяване', desc: 'Удовлетвореност, лоялност, NPS и обратна връзка.', icon: '❤️' },
];

export default function Services() {
  const { t } = useLanguage();
  const { getSection } = useSiteContent();
  const section = getSection('services');

  const title = section?.title || t('services.title');
  const subtitle = section?.subtitle || t('services.subtitle');

  return (
    <section id="услуги" className="relative py-32">
      <div className="absolute inset-0 bg-vancore-dark/85" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Услуги</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4" dangerouslySetInnerHTML={{
            __html: title.replace('{highlight}', '<span class="gradient-text">').replace('{/highlight}', '</span>'),
          }} />
          <p className="text-vancore-muted max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service, i) => (
            <div key={i} className="group glass rounded-2xl p-6 hover:border-vancore-bronze/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-vancore-bronze/5">
              <div className="text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
              <h3 className="font-bold text-sm mb-2 text-vancore-light">{service.title}</h3>
              <p className="text-xs text-vancore-muted leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#анализ" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-full hover:shadow-2xl hover:shadow-vancore-bronze/30 transition-all hover:scale-105">
            {t('services.cta')} <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
