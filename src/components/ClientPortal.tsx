'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Meeting = { id: string; user_name: string; user_email: string; company: string; date: string; time: string; notes: string; status: string };

type AuthMode = 'login' | 'register';

export default function ClientPortal() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'book' | 'meetings'>('book');

  // Check for existing session
  useEffect(() => {
    const saved = localStorage.getItem('vancore_client_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
    }
  }, []);

  // Load meetings when logged in
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const loadMeetings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/client/meetings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMeetings(await res.json());
      } catch {}
    };
    loadMeetings();
  }, [isLoggedIn, token]);

  // Load slots when date changes
  useEffect(() => {
    if (!date) { setSlots([]); return; }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/calendar?date=${date}`);
        const text = await res.text();
        let data: { slots?: string[] } = {};
        try { data = JSON.parse(text); } catch {}
        if (!cancelled) setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [date]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/client/login' : '/api/client/register';
      const body: any = { email: authEmail, password: authPassword };
      if (authMode === 'register') {
        body.name = authName;
        body.company = authCompany;
      }
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) {
        setAuthError(data?.error || (authMode === 'login' ? 'Невалиден имейл или парола.' : 'Грешка при регистрация.'));
        return;
      }
      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('vancore_client_token', data.token);
      if (data.user) {
        setName(data.user.name || '');
        setEmail(data.user.email || '');
        setCompany(data.user.company || '');
      }
    } catch {
      setAuthError('Грешка при свързване със сървъра.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem('vancore_client_token');
    setMeetings([]);
    setActiveTab('book');
  };

  const book = async () => {
    if (!name.trim() || !email.trim() || !selectedSlot || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/client/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, slot: selectedSlot, name, email, company }),
      });
      if (!res.ok) throw new Error('failed');
      setConfirmed(selectedSlot);
      setSelectedSlot(null);
    } catch {
      alert('Неуспешно запазване. Опитайте отново.');
    }
  };

  // ─── Auth Screen ───
  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">
              {authMode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
            <p className="text-sm text-vancore-muted">
              {authMode === 'login'
                ? 'Влезте в клиентския си портал за да управлявайте анализите и срещите си.'
                : 'Създайте акаунт за да запазвате часове и да следите анализите си.'}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark' : 'bg-white/5 text-vancore-muted hover:bg-white/10'}`}
            >
              Вход
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === 'register' ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark' : 'bg-white/5 text-vancore-muted hover:bg-white/10'}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleAuth} className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs text-vancore-muted mb-1">Име и фамилия</label>
                  <input
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Иван Иванов"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light placeholder:text-white/30 focus:outline-none focus:border-vancore-bronze/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-vancore-muted mb-1">Компания</label>
                  <input
                    value={authCompany}
                    onChange={(e) => setAuthCompany(e.target.value)}
                    placeholder="Име на компанията"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light placeholder:text-white/30 focus:outline-none focus:border-vancore-bronze/40"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-vancore-muted mb-1">Имейл</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light placeholder:text-white/30 focus:outline-none focus:border-vancore-bronze/40"
              />
            </div>
            <div>
              <label className="block text-xs text-vancore-muted mb-1">Парола</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light placeholder:text-white/30 focus:outline-none focus:border-vancore-bronze/40"
              />
            </div>

            {authError && <p className="text-sm text-red-400">{authError}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold disabled:opacity-50"
            >
              {authLoading ? 'Зареждане...' : authMode === 'login' ? 'Влез' : 'Регистрирай се'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Logged In Screen ───
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Здравейте, {name || email}</h2>
        <button onClick={logout} className="text-xs text-vancore-muted hover:text-vancore-bronze">Изход</button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'book' ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark' : 'bg-white/5 text-vancore-muted hover:bg-white/10'}`}
        >
          📅 Запази час
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'meetings' ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark' : 'bg-white/5 text-vancore-muted hover:bg-white/10'}`}
        >
          📋 Моите срещи ({meetings.length})
        </button>
      </div>

      {activeTab === 'book' && (
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <div>
            <label className="block text-xs text-vancore-muted mb-2">Изберете дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-vancore-light" />
          </div>

          <div>
            <label className="block text-xs text-vancore-muted mb-2">Свободни часове</label>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button key={slot} onClick={() => setSelectedSlot(slot)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${selectedSlot === slot ? 'border-vancore-bronze bg-vancore-bronze/10 text-vancore-light' : 'border-white/10 text-vancore-muted hover:border-vancore-bronze/40'}`}>{slot}</button>
              ))}
              {slots.length === 0 && <div className="text-xs text-vancore-muted col-span-3">Няма свободни часове за тази дата.</div>}
            </div>
          </div>

          {selectedSlot && !confirmed && (
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име Фамилия" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Имейл" type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Компания" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <button onClick={book} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">Запази час</button>
            </div>
          )}

          {confirmed && <p className="text-sm text-green-400 text-center">✅ Часът {confirmed} е запазен. Ще се свържем с вас.</p>}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="glass rounded-2xl p-6 border border-white/5">
          {meetings.length === 0 ? (
            <p className="text-sm text-vancore-muted text-center">Нямате запазени срещи.</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{m.date} в {m.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {m.status === 'confirmed' ? 'Потвърдена' : 'Чакаща'}
                    </span>
                  </div>
                  {m.notes && <p className="text-xs text-vancore-muted">{m.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
