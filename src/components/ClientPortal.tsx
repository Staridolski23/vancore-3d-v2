'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string | null;
  credits: number | null;
  subscription_status: string | null;
  subscription_end: string | null;
}

interface ChatSession {
  id: string;
  created_at: string;
  messages_count: number;
  last_message: string;
}

const PLANS: Record<string, { name: string; price: string; color: string }> = {
  payg: { name: 'Pay-As-You-Go', price: '€25 / 500 questions', color: '#CD7F32' },
  professional: { name: 'Professional', price: '€49/mo', color: '#C0C0C0' },
  business: { name: 'Business', price: '€99/mo', color: '#FFD700' },
};

export default function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'billing'>('dashboard');
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Check for URL params (coming from Vera chat)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get('plan');
    const urlEmail = params.get('email');
    const urlName = params.get('name');
    
    if (urlPlan && urlEmail) {
      setAuthMode('register');
      setAuthEmail(urlEmail);
      setAuthName(urlName || '');
    }
  }, []);

  // Check for saved token
  useEffect(() => {
    const saved = localStorage.getItem('vancore_client_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
      loadUserData(saved);
    }
  }, []);

  const loadUserData = async (tok: string) => {
    try {
      const res = await fetch(`${API_URL}/api/client/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSessions(data.sessions || []);
      } else {
        // Token expired
        localStorage.removeItem('vancore_client_token');
        setToken(null);
        setIsLoggedIn(false);
      }
    } catch {
      // Will show login
    }
  };

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
        setAuthError(data?.error || (authMode === 'login' ? 'Invalid email or password.' : 'Registration failed.'));
        return;
      }
      
      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('vancore_client_token', data.token);
      
      if (data.user) {
        setUser(data.user);
      }
      
      // If coming from Vera chat with plan selection, redirect to payment
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan');
      if (urlPlan && authMode === 'register') {
        setActiveTab('billing');
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setUser(null);
    localStorage.removeItem('vancore_client_token');
  };

  // Login/Register Form
  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#111] mb-2">
              {authMode === 'login' ? 'Sign in' : 'Create Account'}
            </h2>
            <p className="text-sm text-[#6b6b6b]">
              {authMode === 'login'
                ? 'Access your VANCORE client portal'
                : 'Start your AI-powered business analysis journey'}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                authMode === 'login' ? 'bg-[#991930] text-white' : 'bg-[#f7f6f2] text-[#6b6b6b] hover:bg-[#e5e5e5]'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                authMode === 'register' ? 'bg-[#991930] text-white' : 'bg-[#f7f6f2] text-[#6b6b6b] hover:bg-[#e5e5e5]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="bg-white rounded-2xl p-6 border border-[#e5e5e5] space-y-4 shadow-sm">
            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="authName" className="block text-xs text-[#6b6b6b] mb-1">Full name *</label>
                  <input
                    id="authName"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40"
                  />
                </div>
                <div>
                  <label htmlFor="authCompany" className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                  <input
                    id="authCompany"
                    value={authCompany}
                    onChange={(e) => setAuthCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="authEmail" className="block text-xs text-[#6b6b6b] mb-1">Email *</label>
              <input
                id="authEmail"
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40"
              />
            </div>
            <div>
              <label htmlFor="authPassword" className="block text-xs text-[#6b6b6b] mb-1">Password *</label>
              <input
                id="authPassword"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40"
              />
            </div>

            {authError && <p className="text-sm text-red-500">{authError}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-lg bg-[#991930] text-white font-semibold disabled:opacity-50 hover:bg-[#a83d1f] transition-colors"
            >
              {authLoading ? 'Loading...' : authMode === 'login' ? 'Sign in' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged in — Dashboard
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#111]">Welcome, {user?.name || 'User'}</h2>
          <p className="text-sm text-[#6b6b6b]">{user?.email}</p>
        </div>
        <button onClick={logout} className="text-sm text-[#6b6b6b] hover:text-[#991930]">
          Sign out
        </button>
      </div>

      {/* Subscription Status */}
      <div className={`rounded-xl p-4 border ${
        user?.subscription_status === 'active' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#111]">
              {user?.plan ? PLANS[user.plan]?.name || user.plan : 'Free Plan'}
            </div>
            <div className="text-xs text-[#6b6b6b]">
              {user?.subscription_status === 'active' 
                ? `Active until ${user?.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'N/A'}`
                : user?.credits 
                  ? `${user.credits} questions remaining`
                  : 'No active subscription'}
            </div>
          </div>
          {user?.subscription_status !== 'active' && (
            <a 
              href="/ai-analyst" 
              className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e5e5e5]">
        {(['dashboard', 'chat', 'billing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-[#991930] text-[#991930]' 
                : 'border-transparent text-[#6b6b6b] hover:text-[#111]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
            <div className="text-2xl font-bold text-[#111]">{sessions.length}</div>
            <div className="text-sm text-[#6b6b6b]">Total Conversations</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
            <div className="text-2xl font-bold text-[#111]">
              {sessions.reduce((acc, s) => acc + (s.messages_count || 0), 0)}
            </div>
            <div className="text-sm text-[#6b6b6b]">Questions Asked</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
            <div className="text-2xl font-bold text-[#991930]">
              {user?.plan ? PLANS[user.plan]?.price : '€0'}
            </div>
            <div className="text-sm text-[#6b6b6b]">Current Plan</div>
          </div>
        </div>
      )}

      {/* Chat History Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border border-[#e5e5e5]">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#6b6b6b] mb-4">No conversations yet.</p>
              <a 
                href="/ai-analyst" 
                className="inline-block px-6 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors"
              >
                Start New Analysis
              </a>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-[#f7f6f2] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#111]">
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[#6b6b6b]">
                        {session.messages_count} messages
                      </div>
                    </div>
                    <div className="text-xs text-[#991930]">
                      {session.last_message?.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
            <h3 className="text-base font-semibold text-[#111] mb-3">Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PLANS).map(([id, plan]) => (
                <div 
                  key={id}
                  className={`p-4 rounded-lg border ${
                    user?.plan === id 
                      ? 'border-[#991930] bg-[#991930]/5' 
                      : 'border-[#e5e5e5]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#111]">{plan.name}</div>
                  <div className="text-lg font-bold text-[#991930]">{plan.price}</div>
                  <button
                    className="mt-2 w-full py-1.5 text-xs font-medium rounded-lg bg-[#991930] text-white hover:bg-[#a83d1f] transition-colors"
                  >
                    {user?.plan === id ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
            <h3 className="text-base font-semibold text-[#111] mb-3">Payment History</h3>
            <p className="text-sm text-[#6b6b6b]">No payments yet. Your payment history will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
