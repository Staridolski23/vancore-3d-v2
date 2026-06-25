'use client';

import AdminDashboard from '@/components/AdminDashboard';
import { useState, useEffect } from 'react';

const ADMIN_EMAILS = [
  'momchil@vancore.ai',
  'zhanet@vancore.ai',
  'office@vancoresys.com',
];

export default function AdminPage() {
  const [state, setState] = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vancore_admin_token');
    if (saved) {
      fetch('/api/adminv2', {
        headers: { Authorization: `Bearer ${saved}` },
      }).then(res => {
        if (res.ok) {
          setToken(saved);
          setState('dashboard');
        } else {
          localStorage.removeItem('vancore_admin_token');
          setState('login');
        }
      }).catch(() => {
        localStorage.removeItem('vancore_admin_token');
        setState('login');
      });
    } else {
      setState('login');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/adminv2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setToken(data.token);
      localStorage.setItem('vancore_admin_token', data.token);
      setState('dashboard');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('vancore_admin_token');
    setState('login');
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
      </div>
    );
  }

  if (state === 'login') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#991930] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">V</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-sm text-[#6b6b6b]">VANCORE Business Analysis Platform</p>
          </div>

          <form onSubmit={handleLogin} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@vancoresys.com"
                required
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-[10px] text-[#6b6b6b] text-center">
              Admin emails: momchil@vancore.ai, zhanet@vancore.ai, office@vancoresys.com
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-[#6b6b6b]">Manage clients, analytics, and platform settings</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs text-[#9a9a9a] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <AdminDashboard />
      </div>
    </div>
  );
}
