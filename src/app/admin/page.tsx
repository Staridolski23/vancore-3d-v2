'use client';

import { useState } from 'react';
import AdminStats from '@/components/AdminStats';
import AdminLeads from '@/components/AdminLeads';
import AdminCases from '@/components/AdminCases';
import AdminSessions from '@/components/AdminSessions';
import AdminInbox from '@/components/AdminInbox';
import AdminCalendar from '@/components/AdminCalendar';
import AdminAnalysis from '@/components/AdminAnalysis';
import AdminActivityLog from '@/components/AdminActivityLog';

type AdminView = 'dashboard' | 'leads' | 'cases' | 'sessions' | 'inbox' | 'calendar' | 'analysis' | 'activity';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AdminView>('dashboard');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'janet@vancore.ai' && password === 'vancore2026') setIsLoggedIn(true);
    else if (email === 'momchil.staridolski@vancoresys.com' && password === 'vancore2026') setIsLoggedIn(true);
    else alert('Невалиден логин');
  };

  const navigation: { id: AdminView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Табло', icon: '🏠' },
    { id: 'leads', label: 'Лийдове', icon: '👥' },
    { id: 'cases', label: 'Казуси', icon: '📋' },
    { id: 'sessions', label: 'AI Сесии', icon: '💬' },
    { id: 'inbox', label: 'Входящи', icon: '📥' },
    { id: 'calendar', label: 'Календар', icon: '📅' },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-vancore-dark text-2xl font-bold mx-auto mb-4">V</div>
            <h1 className="text-2xl font-bold">VANCORE Admin</h1>
            <p className="text-vancore-muted text-sm mt-1">Само за екип</p>
          </div>
          <form onSubmit={handleLogin} className="glass rounded-2xl p-6 border border-vancore-bronze/20 space-y-4">
            <div>
              <label className="block text-xs text-vancore-muted mb-2">Имейл</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
            </div>
            <div>
              <label className="block text-xs text-vancore-muted mb-2">Парола</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">Вход</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vancore-dark">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-vancore-dark text-xs font-bold">V</div>
            <span className="font-bold text-sm tracking-wider">VAN<span className="text-vancore-bronze">CORE</span> Admin</span>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-xs text-vancore-muted hover:text-vancore-bronze">Изход</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {navigation.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === item.id ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark' : 'glass text-vancore-muted hover:text-vancore-light'}`}>
              <span className="mr-2">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {view === 'dashboard' && <AdminStats />}
          {view === 'leads' && <AdminLeads />}
          {view === 'cases' && <AdminCases />}
          {view === 'sessions' && <AdminSessions />}
          {view === 'inbox' && <AdminInbox />}
          {view === 'calendar' && <AdminCalendar />}
        </div>
      </div>
    </div>
  );
}
