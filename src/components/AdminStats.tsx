'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Stats = { leads: number; leads_week: number; sessions: number; cases: number; users: number };

export default function AdminStats() {
  const [stats, setStats] = useState<Stats>({ leads: 0, leads_week: 0, sessions: 0, cases: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const cards: { id: string; label: string; value: string; icon: string }[] = [
    { id: 'leads', label: 'Лийдове', value: String(stats.leads), icon: '👥' },
    { id: 'week', label: 'Нови тази седмица', value: String(stats.leads_week), icon: '📅' },
    { id: 'sessions', label: 'AI сесии', value: String(stats.sessions), icon: '💬' },
    { id: 'users', label: 'Потребители', value: String(stats.users), icon: '👤' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Статистики</h2>
      {loading ? (
        <div className="text-center py-12 text-vancore-muted">Зареждане...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <button key={card.id} onClick={() => setSelectedSection(card.id)} className="glass rounded-2xl p-4 border border-white/5 hover:border-vancore-bronze/30 transition-all duration-300 text-left group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-vancore-muted group-hover:text-vancore-bronze transition-colors">{card.label}</span>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="text-2xl font-bold text-vancore-gold">{card.value}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
