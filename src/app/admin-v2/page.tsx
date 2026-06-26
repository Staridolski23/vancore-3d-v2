'use client';

import AdminDashboard from '@/components/AdminDashboard';
import { useState, useEffect } from 'react';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

export default function AdminPage() {
  const [state, setState] = useState<'loading' | 'dashboard'>('loading');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Check if logged in via Supabase auth (from /login page)
    const adminToken = localStorage.getItem('vancore_client_token');
    if (adminToken && adminToken.length > 20) {
      // Verify token and check if admin
      fetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + adminToken },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            if (data.user?.role === 'admin' || ADMIN_EMAILS.includes(data.user?.email?.toLowerCase())) {
              setToken(adminToken);
              setState('dashboard');
            } else {
              // Not an admin - redirect to login
              localStorage.removeItem('vancore_client_token');
              window.location.href = '/login';
            }
          });
        } else {
          localStorage.removeItem('vancore_client_token');
          window.location.href = '/login';
        }
      }).catch(() => {
        localStorage.removeItem('vancore_client_token');
        window.location.href = '/login';
      });
    } else {
      // No token - redirect to login
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('vancore_client_token');
    window.location.href = '/login';
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
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
        <AdminDashboard token={token} />
      </div>
    </div>
  );
}
