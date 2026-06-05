'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'janet@vancore.ai' && password === 'vancore2026') setIsLoggedIn(true);
    else if (email === 'momchil@vancore.ai' && password === 'vancore2026') setIsLoggedIn(true);
    else alert('Невалиден логин');
  };

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
            <div><label className="block text-xs text-vancore-muted mb-2">Вход с email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" /></div>
            <div><label className="block text-xs text-vancore-muted mb-2">Парола</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" /></div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">Вход</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-vancore-dark text-xs font-bold">V</div><span className="font-bold text-sm tracking-wider">VAN<span className="text-vancore-bronze">CORE</span> Admin</span></div>
          <button onClick={() => setIsLoggedIn(false)} className="text-xs text-vancore-muted hover:text-vancore-bronze">Изход</button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Админ панел</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[ { label: 'Активни лидове', value: '12' }, { label: 'Нови тази седмица', value: '3' }, { label: 'AI чат сесии', value: '47' }, { label: 'Използвани казуси', value: '89' } ].map((stat, i) => (
            <div key={i} className="glass rounded-2xl p-4 border border-white/5"><div className="text-xs text-vancore-muted mb-1">{stat.label}</div><div className="text-2xl font-bold text-vancore-bronze">{stat.value}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
