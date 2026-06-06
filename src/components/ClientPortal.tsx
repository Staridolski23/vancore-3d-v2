'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type User = {
  id: string;
  email: string;
  company?: string;
};

export default function ClientPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      // not logged in
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, company };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Грешка');
      setUser(data);
      setEmail('');
      setPassword('');
      setCompany('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5">
        <p className="text-sm text-vancore-muted">Зареждане...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Добре дошли отново!</h3>
            <p className="text-sm text-vancore-muted">{user.email}</p>
            {user.company && <p className="text-xs text-vancore-muted">{user.company}</p>}
          </div>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors">Изход</button>
        </div>
        <div className="text-sm text-vancore-muted">Тук скоро ще можете да виждате вашите анализи и история на сесиите.</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5 max-w-md mx-auto space-y-4">
      <h3 className="text-lg font-bold text-center">Клиентски портал</h3>
      <div className="flex rounded-lg bg-white/5 p-1">
        <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Вход</button>
        <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Регистрация</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Имейл</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Парола</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-xs text-vancore-muted mb-1">Компания (опционално)</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </button>
      </form>
    </div>
  );
}
