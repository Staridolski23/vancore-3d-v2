'use client';

const stats = [
  { id: 'leads', label: 'Активни лидове', value: '12', icon: '👥' },
  { id: 'week', label: 'Нови тази седмица', value: '3', icon: '📅' },
  { id: 'sessions', label: 'AI чат сесии', value: '47', icon: '💬' },
  { id: 'cases', label: 'Използвани казуси', value: '89', icon: '📋' },
];

export default function AdminStats({ onSelectSection }: { onSelectSection?: (section: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <button key={stat.id} onClick={() => onSelectSection && onSelectSection(stat.id)} className="glass rounded-2xl p-4 border border-white/5 hover:border-vancore-bronze/30 transition-all duration-300 text-left group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-vancore-muted group-hover:text-vancore-bronze transition-colors">{stat.label}</span>
            <span className="text-xl">{stat.icon}</span>
          </div>
          <div className="text-2xl font-bold text-vancore-bronze">{stat.value}</div>
        </button>
      ))}
    </div>
  );
}
