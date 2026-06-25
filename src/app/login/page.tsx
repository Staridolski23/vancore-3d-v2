'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setNeedsVerification(false);
    setResendSuccess(false);

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

      // Save token
      localStorage.setItem('vancore_client_token', data.token);

      // Redirect based on role
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

  const resendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend-verification', email: verifyEmail }),
      });
      setResendSuccess(true);
    } catch {} finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#991930] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">V</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Sign in to VANCORE</h1>
          <p className="text-sm text-[#6b6b6b]">Access your AI business analysis platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] rounded-xl p-6 border border-white/5 space-y-4">
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

          {needsVerification && (
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📧</span>
                <div>
                  <p className="text-sm text-white font-medium">Email verification required</p>
                  <p className="text-xs text-[#9a9a9a] mt-1">
                    Please verify <strong className="text-white">{verifyEmail}</strong> before logging in.
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-[10px] text-[#6b6b6b] text-center">
            Don&apos;t have an account?{' '}
            <a href="/ai-analyst" className="text-[#991930] hover:underline">Get free analysis</a>
          </p>
        </form>
      </div>
    </div>
  );
}
