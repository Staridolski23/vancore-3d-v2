'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type View = 'login' | 'register' | 'forgot-password' | 'verify-sent' | 'register-success' | 'reset-password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [recovery, setRecovery] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const recoveryAddress = useRef<string | null>(null);

  // Sync view with URL parameter
  useEffect(() => {
    const address = window.location.pathname + window.location.search;
    if (recoveryAddress.current === address && !window.location.hash) return;
    if (recoveryAddress.current !== address) recoveryAddress.current = null;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.get('type') === 'recovery' || fragment.has('error_code')) {
      // Keep recovery credentials only in memory and remove them from the URL.
      recoveryAddress.current = address;
      window.history.replaceState(null, '', address);
      const accessToken = fragment.get('access_token'), refreshToken = fragment.get('refresh_token');
      if (accessToken && refreshToken && !fragment.has('error_code')) {
        setRecovery({ accessToken, refreshToken }); setPassword(''); setView('reset-password');
      } else {
        setError('This recovery link is invalid or expired. Request a new one.'); setView('forgot-password');
      }
      return;
    }
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setView('register');
    } else {
      setView('login');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setNeedsVerification(false);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await res.json();

      if (data?.needsVerification) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setNeedsVerification(true);
        setVerifyEmail(email);
        setLoading(false);
        return;
      }

      if (!res.ok || !data?.token) {
        setError(data?.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      localStorage.setItem('vancore_client_token', data.token);
      // Also set a cookie for 30 days
      document.cookie = 'vancore_remember=1; max-age=' + (30 * 24 * 60 * 60) + '; path=/';

      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else if (data.user?.role === 'admin') {
        window.location.href = '/admin-v2';
      } else {
        window.location.href = '/client-portal';
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!recovery || password.length < 8 || password.length > 128 || password !== confirmPassword) { setError('Enter matching passwords of 8–128 characters.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recover-password', ...recovery, newPassword: password }) });
      if (!response.ok) { setError('Your password could not be reset. Check the link and password requirements, or request a new link.'); return; }
      localStorage.removeItem('vancore_client_token'); setRecovery(null); setPassword(''); setConfirmPassword('');
      setSuccess('Password updated. Sign in with your new password.'); setView('login');
    } catch { setError('Connection error. Your password change could not be confirmed.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name, company, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      setView('register-success');
      setSuccess('Registration successful! Please check your email to verify your account.');
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to send reset email.');
        setLoading(false);
        return;
      }

      setSuccess('Password reset email sent! Check your inbox.');
      setView('login');
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend-verification', email: verifyEmail }),
      });
      setSuccess('Verification email sent! Check your inbox.');
    } catch {
      setError('Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {view === 'reset-password' && <form onSubmit={handleRecovery} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
          <h1 className="text-xl font-bold text-white">Set a new password</h1>
          <label htmlFor="recovery-password" className="block text-sm text-white">New password</label>
          <input id="recovery-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white" />
          <label htmlFor="recovery-confirm" className="block text-sm text-white">Confirm new password</label>
          <input id="recovery-confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white" />
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-[#991930] p-3 text-white disabled:opacity-50">{loading ? 'Updating...' : 'Update password'}</button>
        </form>}
        {/* Login View */}
        {view === 'login' && (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#991930] rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">V</span>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Sign in to VANCORE</h1>
              <p className="text-sm text-[#6b6b6b]">Access your AI business analysis platform</p>
            </div>

            <form onSubmit={handleLogin} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-[#6b6b6b] mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs text-[#6b6b6b] mb-1.5">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2">{success}</p>
              )}

              {needsVerification && (
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📧</span>
                    <div>
                      <p className="text-sm text-white font-medium">Email not verified</p>
                      <p className="text-xs text-[#9a9a9a] mt-1">
                        Please verify <strong className="text-white">{verifyEmail}</strong> before logging in.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={loading}
                    className="w-full py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-medium hover:bg-[#e08e0b] disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView('forgot-password')}
                  className="text-xs text-[#6b6b6b] hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => { setView('register'); setError(''); setSuccess(''); }}
                  className="text-xs text-[#991930] hover:underline font-medium"
                >
                  Create account
                </button>
              </div>
            </form>
          </>
        )}

        {/* Register View */}
        {view === 'register' && (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#991930] rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">V</span>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Create Account</h1>
              <p className="text-sm text-[#6b6b6b]">Start your AI-powered business analysis journey</p>
            </div>

            <form onSubmit={handleRegister} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs text-[#6b6b6b] mb-1.5">Full name *</label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="reg-company" className="block text-xs text-[#6b6b6b] mb-1.5">Company</label>
                <input
                  id="reg-company"
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Company name"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs text-[#6b6b6b] mb-1.5">Phone</label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+359 888 123456"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-xs text-[#6b6b6b] mb-1.5">Email *</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-xs text-[#6b6b6b] mb-1.5">Password *</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                  className="text-xs text-[#6b6b6b] hover:text-white transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </>
        )}

        {/* Register Success View */}
        {view === 'register-success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Check your email!</h1>
            <p className="text-sm text-[#6b6b6b] mb-6">
              We sent a verification link to <strong className="text-white">{email}</strong>. 
              Please verify your email before logging in.
            </p>
            <button
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] transition-colors"
            >
              Go to Sign in
            </button>
          </div>
        )}

        {/* Forgot Password View */}
        {view === 'forgot-password' && (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#991930] rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">🔑</span>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Reset Password</h1>
              <p className="text-sm text-[#6b6b6b]">Enter your email and we'll send you a reset link</p>
            </div>

            <form onSubmit={handleForgotPassword} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label htmlFor="fp-email" className="block text-xs text-[#6b6b6b] mb-1.5">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                  className="text-xs text-[#6b6b6b] hover:text-white transition-colors"
                >
                  Back to Sign in
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
