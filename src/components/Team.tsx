'use client';

import { useLanguage } from '@/hooks/useLanguage';

const teamMembers = [
  {
    key: 'team.members.zhanet',
    avatar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    colorClass: 'from-pink-500/20 to-rose-500/20',
  },
  {
    key: 'team.members.momchil',
    avatar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    colorClass: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    key: 'team.members.aiAgents',
    avatar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
        <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 21h8M12 17v4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    colorClass: 'from-vancore-bronze/20 to-vancore-gold/20',
  },
];

export default function Team() {
  const { messages } = useLanguage();
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

  return (
    <section id="екип" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/60 to-vancore-dark/90" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">{t('team.title').replace(/<[^>]*>/g, '')}</span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black mb-4"
            dangerouslySetInnerHTML={{
              __html: t('team.title').replace('{highlight}', '<span class="gradient-text">').replace('{/highlight}', '</span>'),
            }}
          />
          <p className="text-vancore-muted max-w-2xl mx-auto">{t('team.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {teamMembers.map((member, i) => {
            const data = t(member.key);
            const Icon = member.avatar;

            return (
              <div
                key={i}
                className="glass rounded-3xl p-8 text-center hover:-translate-y-2 transition-all duration-500 border border-white/5 hover:border-vancore-bronze/30"
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.colorClass} flex items-center justify-center text-vancore-bronze mx-auto mb-6`}>
                  {Icon}
                </div>
                <h3 className="text-xl font-bold mb-1">{data.name}</h3>
                <p className="text-sm text-vancore-bronze mb-6">{data.role}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {data.skills.map((s: string, j: number) => (
                    <span key={j} className="text-xs px-3 py-1 rounded-full bg-white/5 text-vancore-muted border border-white/5">{s}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
