'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function AdminStats({ onSelectSection }: { onSelectSection?: (section: string) => void }) {
  const [stats, setStats] = useState({
    leads: 0,
    leads_week: 0,
    sessions: 0,
    cases: 0,
    users: 0,
  });

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const items = [
    { id: 'leads', label: 'Лийдове', value: String(stats.leads), icon: '👥' },
    { id: 'week', label: 'Нови тази седмица', value: String(stats.leads_week), icon: '📅' },
    { id: 'sessions', label: 'AI сесии', value: String(stats.sessions), icon: '💬' },
    { id: 'users', label: 'Потребители', value: String(stats.users), icon: '👤' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Статистики</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectSection && onSelectSection(item.id)}
            className="glass rounded-2xl p-4 border border-white/5 hover:border-vancore-bronze/30 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-vancore-muted group-hover:text-vancore-bronze transition-colors">{item.label}</span>
              <span className="text-xl">{item.icon}</span>
            </div>
            <div className="text-2xl font-bold text-vancore-gold">{item.value}</div>
          </button>
        ))}
      </div>
    </div>
  );
}