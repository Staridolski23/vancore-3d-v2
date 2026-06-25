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

interface Insight {
  id: string;
  text: string;
  time: string;
  category: string;
}

interface Activity {
  id: string;
  type: 'conversation' | 'report' | 'meeting' | 'account';
  text: string;
  time: string;
  icon: string;
}

const PLANS: Record<string, { name: string; price: string; color: string }> = {
  starter: { name: 'Starter', price: '€0', color: '#6b6b6b' },
  payg: { name: 'Pay-As-You-Go', price: '€25 / 500 questions', color: '#CD7F32' },
  professional: { name: 'Professional', price: '€49/mo', color: '#C0C0C0' },
  business: { name: 'Business', price: '€99/mo', color: '#FFD700' },
};

const CLARITY_DATA = [
  { label: 'Finance', value: 80, color: '#10b981' },
  { label: 'Operations', value: 60, color: '#f59e0b' },
  { label: 'HR', value: 40, color: '#ef4444' },
  { label: 'Marketing', value: 75, color: '#10b981' },
  { label: 'Strategy', value: 55, color: '#f59e0b' },
];

const MOCK_INSIGHTS: Insight[] = [
  {
    id: '1',
    text: '31% efficiency increase in HoReCa typically correlates with inventory management improvements. Have you audited your stock rotation this month?',
    time: '2 hours ago',
    category: 'Operations',
  },
  {
    id: '2',
    text: 'SMEs that review financials weekly are 2.3x more likely to hit growth targets. Your last review was 18 days ago.',
    time: '1 day ago',
    category: 'Finance',
  },
  {
    id: '3',
    text: 'Your competitor analysis shows a gap in digital marketing. Businesses in your segment that invest in SEO see 45% more organic leads.',
    time: '3 days ago',
    category: 'Marketing',
  },
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'conversation', text: 'New conversation with Vera about supply chain', time: '2 hours ago', icon: '💬' },
  { id: '2', type: 'report', text: 'Monthly Business Health Report generated', time: '5 days ago', icon: '📊' },
  { id: '3', type: 'meeting', text: 'Strategy call with Momchil confirmed — Jul 2', time: '1 week ago', icon: '📅' },
  { id: '4', type: 'account', text: 'Account created — Welcome to VANCORE', time: '12 days ago', icon: '⚪' },
];

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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'billing' | 'settings'>('dashboard');

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
      } else {
        localStorage.removeItem('vancore_client_token');
        setToken(null);
        setIsLoggedIn(false);
      }
    } catch {}
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
      if (data?.needsVerification) {
        setAuthError('Please verify your email before logging in. Check your inbox for the verification link.');
        setNeedsVerification(true);
        setVerifyEmail(authEmail);
        setAuthLoading(false);
        return;
      }
      if (!res.ok || !data?.token) {
        setAuthError(data?.error || (authMode === 'login' ? 'Invalid email or password.' : 'Registration failed.'));
        return;
      }
      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('vancore_client_token', data.token);
      if (data.user) setUser(data.user);
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
    setNeedsVerification(false);
    setResendSuccess(false);
  };

  const resendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await fetch(`${API_URL}/api/client/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail }),
      });
      setResendSuccess(true);
    } catch {} finally {
      setResendLoading(false);
    }
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
                  <input id="authName" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="John Doe" required className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40" />
                </div>
                <div>
                  <label htmlFor="authCompany" className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                  <input id="authCompany" value={authCompany} onChange={(e) => setAuthCompany(e.target.value)} placeholder="Company name" className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40" />
                </div>
              </>
            )}
            <div>
              <label htmlFor="authEmail" className="block text-xs text-[#6b6b6b] mb-1">Email *</label>
              <input id="authEmail" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@company.com" required className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40" />
            </div>
            <div>
              <label htmlFor="authPassword" className="block text-xs text-[#6b6b6b] mb-1">Password *</label>
              <input id="authPassword" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full bg-[#f7f6f2] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#991930]/40" />
            </div>
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            
            {needsVerification && (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-sm text-[#111] font-medium">Email verification required</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Please verify your email address <strong>{verifyEmail}</strong> before logging in. 
                      Check your inbox for the verification link.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendLoading}
                  className="w-full py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-medium hover:bg-[#e08e0b] disabled:opacity-50 transition-colors"
                >
                  {resendLoading ? 'Sending...' : resendSuccess ? '✅ Email sent!' : 'Resend Verification Email'}
                </button>
              </div>
            )}
            
            <button type="submit" disabled={authLoading} className="w-full py-2.5 rounded-lg bg-[#991930] text-white font-semibold disabled:opacity-50 hover:bg-[#a83d1f] transition-colors">
              {authLoading ? 'Loading...' : authMode === 'login' ? 'Sign in' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged in — Dashboard
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
          <div className="h-full bg-gradient-to-r from-[#991930] to-[#c94f2b] rounded-full transition-all duration-1000" style={{ width: `${clarityScore}%` }} />
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

      {/* Clarity Score Breakdown */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
        <h3 className="text-base font-semibold text-white mb-4">Business Clarity Breakdown</h3>
        <div className="space-y-3">
          {CLARITY_DATA.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-20 text-sm text-[#9a9a9a]">{item.label}</div>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
              <div className="w-10 text-right text-sm font-medium text-white">{item.value}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights Feed */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">🤖 Vera&apos;s Insights</h3>
          <a href="/ai-analyst" className="text-xs text-[#991930] hover:underline">Ask Follow-up →</a>
        </div>
        <div className="space-y-3">
          {MOCK_INSIGHTS.map((insight) => (
            <div key={insight.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#991930]/20 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-lg">📌</span>
                <div className="flex-1">
                  <p className="text-sm text-white leading-relaxed">{insight.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#6b6b6b]">{insight.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#9a9a9a]">{insight.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            <div className="text-lg font-semibold text-white">{PLANS[currentPlan]?.name || 'Starter'}</div>
            <div className="text-sm text-[#6b6b6b]">{PLANS[currentPlan]?.price || '€0'}</div>
          </div>
          {user?.subscription_status !== 'active' && (
            <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
              Upgrade
            </a>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">87</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Questions</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">3</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Reports</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xl font-bold text-white">1</div>
            <div className="text-[10px] text-[#6b6b6b] uppercase">Calls</div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
        <h3 className="text-base font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {MOCK_ACTIVITIES.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.text}</p>
                <p className="text-[10px] text-[#6b6b6b]">{activity.time}</p>
              </div>
            </div>
          ))}
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
