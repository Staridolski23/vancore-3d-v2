'use client';

const team = [
  { name: 'Жанет Топалова', role: 'Co-founder & Operations Director', emoji: '👩‍💼', color: 'from-pink-500/20 to-rose-500/20', strengths: ['Project Management', 'Бизнес анализ', 'Маркетинг', 'Бранд идентичност'] },
  { name: 'Момчил Старолидолски', role: 'Co-founder & Technical Director', emoji: '👨‍💻', color: 'from-blue-500/20 to-cyan-500/20', strengths: ['AI инструменти', 'Анализ на данни', 'Продажби', 'Логистика'] },
  { name: 'Нашите AI Агенти', role: 'Operations AI Team', emoji: '🤖', color: 'from-vancore-bronze/20 to-vancore-gold/20', strengths: ['24/7 Анализ', 'Данни', 'Автоматизация', 'Бързи отговори'] },
];

export default function Team() {
  return (
    <section id="екип" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/60 to-vancore-dark/90" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Екип</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Кое е нашият <span className="gradient-text">супер екип</span></h2>
          <p className="text-vancore-muted max-w-2xl mx-auto">Човешки експерти + AI агенти = безкомпромисен анализ за вашия бизнес.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <div key={i} className="glass rounded-3xl p-8 text-center hover:-translate-y-2 transition-all duration-500 border border-white/5 hover:border-vancore-bronze/30">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-4xl mx-auto mb-6`}>{member.emoji}</div>
              <h3 className="text-xl font-bold mb-1">{member.name}</h3>
              <p className="text-sm text-vancore-bronze mb-6">{member.role}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {member.strengths.map((s, j) => (
                  <span key={j} className="text-xs px-3 py-1 rounded-full bg-white/5 text-vancore-muted border border-white/5">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
