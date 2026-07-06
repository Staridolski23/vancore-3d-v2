'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  vat_id?: string;
  plan: string | null;
  credits: number | null;
  subscription_status: string | null;
  role?: string;
}

export default function ClientPortal() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'documents' | 'reports' | 'history' | 'billing' | 'settings'>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reportContent, setReportContent] = useState('');
  const searchParams = useSearchParams();

  // Check if coming from Vera with plan selection
  const planParam = searchParams.get('plan');
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');

  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            setUser(data.user);
            setStatus('dashboard');
            if (planParam) {
              setActiveTab('billing');
            }
            // Fetch bookings
            fetch('/api/bookings?email=' + data.user.email)
              .then(r => r.json())
              .then(data => setBookings(data.bookings || []))
              .catch(() => setBookings([]));
            // Fetch documents
            fetch('/api/documents?email=' + data.user.email)
              .then(r => r.json())
              .then(data => setDocuments(data.documents || []))
              .catch(() => setDocuments([]));
          });
        } else {
          localStorage.removeItem('vancore_client_token');
          setStatus('login');
        }
      }).catch(() => {
        localStorage.removeItem('vancore_client_token');
        setStatus('login');
      });
    } else {
      setStatus('login');
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vancore_client_token');
    setStatus('login');
  };

  const generateReport = async (): Promise<string> => {
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Please generate a concise business status report for the logged-in client.' }),
      });
      const data = await res.json();
      return data.reply || data.message || 'Report generation failed.';
    } catch (e) {
      return 'Error generating report.';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
      </div>
    );
  }

  if (status === 'login') {
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
    return null;
  }

  const clarityScore = 31;
  const currentPlan = user?.plan || 'starter';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#111] p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: '📋' },
          { key: 'bookings', label: 'My Bookings', icon: '📅' },
          { key: 'reports', label: 'Reports', icon: '📄' },
          { key: 'history', label: 'History', icon: '🕒' },
          { key: 'billing', label: 'Billing', icon: '💳' },
          { key: 'documents', label: 'Documents', icon: '📁' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#991930] text-white'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Welcome, {user?.name || 'User'}! ☀️</h2>
                <p className="text-sm text-[#9a9a9a]">{user?.company || 'No company'}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#991930]">{clarityScore}%</div>
                <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider">Clarity Score</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#991930] to-[#c94f2b] rounded-full" style={{ width: clarityScore + '%' }} />
            </div>
            <div className="mt-4 flex gap-3">
              <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                💬 Talk to Vera
              </a>
              <button onClick={() => setActiveTab('reports')} className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                📄 View Reports
              </button>
            </div>
          </div>

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
                <button onClick={() => setActiveTab('billing')} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => setActiveTab('reports')} className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">View Reports</div>
            </button>
            <button onClick={() => setActiveTab('history')} className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Chat History</div>
            </button>
            <button onClick={() => setActiveTab('billing')} className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Billing</div>
            </button>
            <button onClick={() => setActiveTab('settings')} className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Settings</div>
            </button>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">My Bookings</h3>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm text-[#6b6b6b] mb-4">You don't have any bookings yet.</p>
                <a href="/book-call" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                  Book a Call
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-white">{booking.date} @ {booking.time}</div>
                        <div className="text-xs text-[#9a9a9a]">{booking.name} {booking.email && <span className="text-[#6b6b6b]">&lt;{booking.email}&gt;</span>}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        booking.status === 'rescheduled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {booking.status || 'new'}
                      </span>
                    </div>
                    {booking.company && <div className="text-xs text-[#6b6b6b] mb-1">🏢 {booking.company}</div>}
                    {booking.phone && <div className="text-xs text-[#6b6b6b] mb-1">📞 {booking.phone}</div>}
                    {booking.description && <div className="text-xs text-[#6b6b6b] mt-2 italic">"{booking.description}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📁</div>
                <p className="text-sm text-[#6b6b6b] mb-4">You don't have any documents yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div>
                      <div className="text-sm text-white">{doc.name}</div>
                      <div className="text-xs text-[#6b6b6b]">{doc.filename}</div>
                    </div>
                    <a href={'/api/documents/' + doc.filename} className="text-xs text-[#991930] hover:underline" target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Your Reports</h3>
              <button onClick={async () => {
                const report = await generateReport();
                setReportContent(report);
              }} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Generate Report
              </button>
            </div>
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm text-[#6b6b6b] mb-4">You don't have any reports yet.</p>
              <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Talk to Vera
              </a>
            </div>
          </div>
          {reportContent && (
            <div className="bg-[#111] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Generated Report</h4>
                <button onClick={() => setReportContent('')} className="text-xs text-[#991930] hover:underline">Close</button>
              </div>
              <pre className="text-xs text-[#9a9a9a] whitespace-pre-wrap leading-relaxed">{reportContent}</pre>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Chat History</h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-[#6b6b6b] mb-4">No conversations yet.</p>
              <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Start a Conversation
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {planParam && (
            <div className="bg-[#991930]/10 border border-[#991930]/30 rounded-xl p-4">
              <p className="text-sm text-white">
                You selected the <strong>{planParam === 'professional' ? 'Professional (€49/mo)' : planParam === 'business' ? 'Business (€99/mo)' : 'Pay-As-You-Go (€25)'}</strong> plan.
                Complete your registration to activate it.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'payg', name: 'Pay-As-You-Go', price: '€25', features: ['500 AI questions', 'No monthly commitment', 'Valid for 3 months'] },
              { id: 'professional', name: 'Professional', price: '€49/mo', features: ['Unlimited AI questions', 'Monthly business report', 'Client portal access', 'Priority support'] },
              { id: 'business', name: 'Business', price: '€99/mo', features: ['Everything in Professional', 'Weekly auto-analysis', '2 human consultant calls/month', 'Growth plan'] },
            ].map((plan) => (
              <div key={plan.id} className={`p-5 rounded-xl border ${currentPlan === plan.id ? 'border-[#991930] bg-[#991930]/10' : 'border-white/10 bg-[#111]'}`}>
                <div className="text-sm font-semibold text-white">{plan.name}</div>
                <div className="text-2xl font-bold text-[#991930] my-2">{plan.price}</div>
                <ul className="space-y-1 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-[#9a9a9a]">✓ {f}</li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPlan === plan.id
                      ? 'bg-[#991930] text-white'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Name</label>
                <input type="text" defaultValue={user?.name || ''} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Email</label>
                <input type="email" defaultValue={user?.email || ''} disabled className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#6b6b6b]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                <input type="text" defaultValue={user?.company || ''} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">VAT ID</label>
                <input type="text" defaultValue={user?.vat_id || ''} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Phone</label>
                <input type="tel" defaultValue={user?.phone || ''} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <button className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Current Password</label>
                <input type="password" id="current-password" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">New Password</label>
                <input type="password" id="new-password" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <button onClick={async () => {
                const email = user?.email || '';
                const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value || '';
                const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value || '';
                if (!email || !currentPassword || !newPassword) {
                  alert('All fields are required');
                  return;
                }
                try {
                  const res = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'change-password', email, currentPassword, newPassword }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(data.message || 'Password updated');
                    (document.getElementById('current-password') as HTMLInputElement) ? (document.getElementById('current-password') as HTMLInputElement).value = '' : null;
                    (document.getElementById('new-password') as HTMLInputElement) ? (document.getElementById('new-password') as HTMLInputElement).value = '' : null;
                  } else {
                    alert(data.error || 'Password change failed');
                  }
                } catch {
                  alert('Password change failed. Please try again.');
                }
              }} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Update Password
              </button>
            </div>
          </div>

          <div className="text-center pt-4">
            <button onClick={logout} className="text-sm text-[#6b6b6b] hover:text-[#991930] transition-colors">
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
