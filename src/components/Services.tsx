'use client';

const services = [
  { icon: '💰', title: 'Финанси', desc: 'Анализ на приходи, разходи, маржове, бюджетиране' },
  { icon: '⚙️', title: 'Операции', desc: 'Оптимизация на процеси, автоматизация, supply chain' },
  { icon: '📢', title: 'Маркетинг', desc: 'Стратегия, дигитален маркетинг, SEO, социални медии' },
  { icon: '📈', title: 'Продажби', desc: 'Sales funnel, CRM, конверсия, клиентско изживяване' },
  { icon: '👥', title: 'HR', desc: 'Онбординг, мотивация, KPI, обучение, текучест' },
  { icon: '💻', title: 'IT', desc: 'Дигитализация, инфраструктура, софтуерни решения' },
  { icon: '🎨', title: 'Бранд', desc: 'Идентичност, визуален език, позициониране' },
  { icon: '⚖️', title: 'Юридически', desc: 'Съответствие, договори, регулаторни изисквания' },
  { icon: '🧭', title: 'Стратегия', desc: 'Бизнес план, KPI, растеж, мащабиране' },
  { icon: '⭐', title: 'Клиентско изживяване', desc: 'Удовлетвореност, лоялност, NPS, обратна връзка' },
];

export default function Services() {
  return (
    <section id="услуги" className="relative py-32">
      <div className="absolute inset-0 bg-vancore-dark/85" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Услуги</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">10 аспекта на <span className="gradient-text">вашия бизнес</span></h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">Не гледаме част от картината. Анализираме ВСИЧКО.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service, i) => (
            <div key={i} className="group glass rounded-2xl p-6 hover:border-vancore-bronze/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-vancore-bronze/5">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
              <h3 className="font-bold text-sm mb-2 text-vancore-light">{service.title}</h3>
              <p className="text-xs text-vancore-muted leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#анализ" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-full hover:shadow-2xl hover:shadow-vancore-bronze/30 transition-all hover:scale-105">Започнете безплатен анализ <span>→</span></a>
        </div>
      </div>
    </section>
  );
}
