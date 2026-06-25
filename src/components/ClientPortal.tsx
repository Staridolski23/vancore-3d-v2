'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string | null;
  credits: number | null;
  subscription_status: string | null;
  role?: string;
}

export default function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('vancore_client_token');
    if (saved) {
      fetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + saved },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            setUser(data.user);
            setIsLoggedIn(true);
          });
        } else {
          localStorage.removeItem('vancore_client_token');
          setIsLoggedIn(false);
        }
      }).catch(() => {
        localStorage.removeItem('vancore_client_token');
        setIsLoggedIn(false);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('vancore_client_token');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#6b6b6b]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const clarityScore = 31;
  const currentPlan = user?.plan || 'starter';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Welcome, {user?.name || 'User'}! ☀️</h2>
            <p className="text-sm text-[#9a9a9a]">How confident do you feel about your business performance today?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#991930]">{clarityScore}%</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider">Clarity Score</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#991930] to-[#c94f2b] rounded-full transition-all duration-1000" style={{ width: clarityScore + '%' }} />
        </div>
        <div className="mt-4 flex gap-3">
          <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
            💬 Talk to Vera
          </a>
          <button className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors border border-white/10">
            📊 View Reports
          </button>
        </div>
      </div>

      {/* Active Plan & Usage */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Active Plan</h3>
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-[#10b981]/20 text-[#10b981]">
            {user?.subscription_status === 'active' ? 'Active' : 'Free'}
          </span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold text-white">{currentPlan === 'business' ? 'Business' : currentPlan === 'professional' ? 'Professional' : 'Starter'}</div>
            <div className="text-sm text-[#6b6b6b]">{currentPlan === 'business' ? '€99/mo' : currentPlan === 'professional' ? '€49/mo' : '€0'}</div>
          </div>
          {user?.subscription_status !== 'active' && (
            <button className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
              Upgrade
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{user?.credits || 0}</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Credits</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">0</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Reports</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">0</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Calls</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/ai-analyst" className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Talk to Vera</div>
        </a>
        <button className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Generate Report</div>
        </button>
        <button className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Book Call</div>
        </button>
        <button className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
          <div className="text-2xl mb-2">💳</div>
          <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Upgrade Plan</div>
        </button>
      </div>

      {/* Sign Out */}
      <div className="text-center pt-4">
        <button onClick={logout} className="text-sm text-[#6b6b6b] hover:text-[#991930] transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}
