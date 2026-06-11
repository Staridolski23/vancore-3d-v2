'use client';

import { useState, useEffect } from 'react';

const API = '';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  services: 'Услуги',
  methodology: 'Методология',
  industries: 'Отрасли',
  team: 'Екип',
  contact: 'Контакт',
  chat: 'AI Анализ',
};

const DEFAULT_SECTIONS: Record<string, { title: string; subtitle: string }> = {
  hero: { title: 'Намерете счупените звена във вашия бизнес', subtitle: 'Ние помагаме на компаниите да мислят глобално.' },
  services: { title: 'Какво анализираме', subtitle: '10 основни аспекта' },
  methodology: { title: 'Нашата Методология', subtitle: 'Стъпка по стъпка' },
  industries: { title: 'Целеви отрасли', subtitle: 'Фокусираме се върху сектори' },
  team: { title: 'Отборът зад VANCORE', subtitle: 'Хора и агенти' },
  contact: { title: 'Започнете промяната', subtitle: 'Напишете ни' },
  chat: { title: 'БЕЗПЛАТЕН AI АНАЛИЗ', subtitle: 'Опишете проблема си' },
};

type AdminView = 'dashboard' | 'leads' | 'cases' | 'sessions' | 'inbox' | 'calendar' | 'analysis' | 'activity' | 'editor';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [view, setView] = useState<AdminView>('dashboard');
  const [error, setError] = useState('');

  // Editor state
  const [sections, setSections] = useState<Record<string, { title: string; subtitle: string }>>(DEFAULT_SECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({ leads: 0, leads_week: 0, sessions: 0, cases: 0, users: 0, meetings: 0, activities: 0 });

  useEffect(() => {
    const prev = typeof window !== 'undefined' ? window.localStorage.getItem('vancore_admin_user') : null;
    if (prev) {
      setIsLoggedIn(true);
      try { setUser(JSON.parse(prev)); } catch {}
    }
    const url = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (url?.get('view') === 'editor') setView('editor');
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadStats();
      if (view === 'editor') loadContent();
    }
  }, [isLoggedIn, view]);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const loadContent = async () => {
    try {
      const res = await fetch(`${API}/api/admin/content`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.sections) setSections({ ...DEFAULT_SECTIONS, ...data.sections });
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.user) {
        setError(data?.error || 'Невалиден имейл или парола.');
        return;
      }
      setUser(data.user);
      setIsLoggedIn(true);
      window.localStorage.setItem('vancore_admin_user', JSON.stringify(data.user));
      setEmail('');
      setPassword('');
    } catch {
      setError('Грешка при вход.');
    }
  };

  const logout = async () => {
    try { await fetch(`${API}/api/admin/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    setIsLoggedIn(false);
    setUser(null);
    window.localStorage.removeItem('vancore_admin_user');
  };

  const selectSection = (id: string) => {
    setSelectedId(id);
    const sec = sections[id] || DEFAULT_SECTIONS[id] || { title: '', subtitle: '' };
    setEditTitle(sec.title || '');
    setEditSubtitle(sec.subtitle || '');
  };

  const saveSection = async () => {
    if (!selectedId) return;
    setSaving(true);
    setStatus('Запазване...');
    try {
      const res = await fetch(`${API}/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle, subtitle: editSubtitle }),
      });
      if (res.ok) {
        setSections((prev) => ({ ...prev, [selectedId]: { title: editTitle, subtitle: editSubtitle } }));
        setStatus('✅ Запазено!');
      } else {
        setStatus('❌ Грешка при запазване');
      }
    } catch {
      setStatus('❌ Грешка');
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const nav: { id: AdminView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Табло', icon: '🏠' },
    { id: 'leads', label: 'Лийдове', icon: '👥' },
    { id: 'cases', label: 'Казуси', icon: '📋' },
    { id: 'sessions', label: 'AI Сесии', icon: '💬' },
    { id: 'inbox', label: 'Входящи', icon: '📥' },
    { id: 'calendar', label: 'Календар', icon: '📅' },
    { id: 'analysis', label: 'Анализ', icon: '📊' },
    { id: 'activity', label: 'Дейности', icon: '📋' },
    { id: 'editor', label: 'Редактор', icon: '🎨' },
  ];

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0c10]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">V</div>
            <h1 className="text-2xl font-bold text-white">VANCORE Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Само за екип</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-2xl p-6 border border-amber-500/20 bg-white/5 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Имейл</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Парола</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold">Вход</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0c10]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black text-xs font-bold">V</div>
            <span className="font-bold text-sm tracking-wider">VAN<span className="text-amber-500">CORE</span> Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{user?.name}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-amber-500">Изход</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {nav.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === item.id ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              <span className="mr-2">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {view === 'dashboard' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Лийдове', value: stats.leads },
                { label: 'Нови седмицата', value: stats.leads_week },
                { label: 'AI Сесии', value: stats.sessions },
                { label: 'Казуси', value: stats.cases },
                { label: 'Потребители', value: stats.users },
                { label: 'Срещи', value: stats.meetings },
                { label: 'Дейности', value: stats.activities },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">🎨 Редактор на сайта</h2>
                  <p className="text-sm text-gray-400 mt-1">Редакрай заглавията и подзаглавията на секциите.</p>
                </div>
                <button onClick={loadContent} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">🔄 Презареди</button>
              </div>

              {status && (
                <div className={`rounded-lg border px-4 py-2 text-sm ${status.includes('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : status.includes('❌') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-gray-400'}`}>{status}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                <aside className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase">Секции</h3>
                  <div className="space-y-1">
                    {Object.keys(DEFAULT_SECTIONS).map((id) => (
                      <button key={id} onClick={() => selectSection(id)} className={`w-full text-left rounded px-2 py-2 text-sm ${selectedId === id ? 'bg-yellow-500 text-black font-semibold' : 'bg-white/5 hover:bg-white/10'}`}>
                        {SECTION_LABELS[id] || id}
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="rounded-lg border border-white/10 bg-white/5 p-4">
                  {selectedId ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{SECTION_LABELS[selectedId] || selectedId}</h3>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Заглавие</label>
                        <input className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Подзаглавие</label>
                        <textarea className="w-full h-24 rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white resize-y" value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} />
                      </div>
                      <button onClick={saveSection} disabled={saving} className="px-5 py-2 rounded bg-yellow-500 text-black font-semibold text-sm disabled:opacity-50">
                        {saving ? 'Запазване...' : '💾 Запази'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">👈 Избери секция отляво.</p>
                  )}
                </section>
              </div>
            </div>
          )}

          {(view === 'leads' || view === 'cases' || view === 'sessions' || view === 'inbox' || view === 'calendar' || view === 'analysis' || view === 'activity') && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-400 text-sm">Секцията "{view}" се зарежда от сървъра. Данните ще се появят след зареждане.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
