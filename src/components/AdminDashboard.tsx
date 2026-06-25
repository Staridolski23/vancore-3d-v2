'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscription_status: string;
  created_at: string;
  email_verified: number;
  credits: number;
}

interface DashboardMetrics {
  totalClients: number;
  activeSubscriptions: number;
  totalCredits: number;
  verifiedEmails: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'analytics' | 'messaging'>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalClients: 0, activeSubscriptions: 0, totalCredits: 0, verifiedEmails: 0 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('vancore_admin_token') || '';
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const headers: any = { 'Authorization': `Bearer ${token}` };
      
      try {
        const res = await fetch('/api/adminv2', { headers });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (e) {
        console.error('Failed to fetch metrics:', e);
      }
      
      try {
        const clientsRes = await fetch('/api/adminv2/clients', { headers });
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }
      } catch (e) {
        console.error('Failed to fetch clients:', e);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#6b6b6b] text-sm">Loading...</div>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <AdminClientDetail 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#111] p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'clients', label: 'Clients', icon: '👥' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
          { key: 'messaging', label: 'Messages', icon: '💬' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#991930] text-white'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Clients" value={metrics.totalClients.toString()} />
            <MetricCard label="Active Subs" value={metrics.activeSubscriptions.toString()} />
            <MetricCard label="Verified Emails" value={metrics.verifiedEmails.toString()} />
            <MetricCard label="Total Credits" value={metrics.totalCredits.toString()} />
          </div>

          {/* Recent Clients */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Clients</h3>
            <div className="space-y-2">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#991930]/20 flex items-center justify-center text-[#991930] text-xs font-semibold">
                      {(client.name || client.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-white">{client.name || client.email}</div>
                      <div className="text-[10px] text-[#6b6b6b]">{client.company || 'No company'}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    client.subscription_status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
                    client.email_verified ? 'bg-white/10 text-[#9a9a9a]' :
                    'bg-[#f59e0b]/20 text-[#f59e0b]'
                  }`}>
                    {client.subscription_status === 'active' ? 'active' : client.email_verified ? 'free' : 'unverified'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <input
            type="text"
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
          />

          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b]">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] hidden sm:table-cell">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#6b6b6b]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{client.name || client.email}</div>
                        <div className="text-[10px] text-[#6b6b6b]">{client.email}</div>
                        <div className="text-[10px] text-[#6b6b6b] sm:hidden">{client.plan} • {client.subscription_status}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          client.plan === 'business' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                          client.plan === 'professional' ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
                          client.plan === 'payg' ? 'bg-[#CD7F32]/20 text-[#CD7F32]' :
                          'bg-white/10 text-[#6b6b6b]'
                        }`}>
                          {client.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          client.subscription_status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          client.email_verified ? 'bg-white/10 text-[#9a9a9a]' :
                          'bg-[#f59e0b]/20 text-[#f59e0b]'
                        }`}>
                          {client.subscription_status === 'active' ? 'active' : client.email_verified ? 'free' : 'unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#9a9a9a]">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="text-xs text-[#991930] hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-[#6b6b6b] text-center">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Clients" value={metrics.totalClients.toString()} />
            <MetricCard label="Active Subs" value={metrics.activeSubscriptions.toString()} />
            <MetricCard label="Verified" value={metrics.verifiedEmails.toString()} />
            <MetricCard label="Total Credits" value={metrics.totalCredits.toString()} />
            <MetricCard label="Unverified" value={(metrics.totalClients - metrics.verifiedEmails).toString()} />
            <MetricCard label="Conversion" value={metrics.totalClients > 0 ? Math.round((metrics.activeSubscriptions / metrics.totalClients) * 100) + '%' : '0%'} />
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Plan Distribution</h3>
            <div className="space-y-3">
              {['starter', 'payg', 'professional', 'business'].map((plan) => {
                const count = clients.filter(c => c.plan === plan).length;
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#9a9a9a] capitalize">{plan}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#991930] rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
                    </div>
                    <div className="w-12 text-right text-xs text-white">{count} ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messaging Tab */}
      {activeTab === 'messaging' && (
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-3">Send Message to Client</h3>
          <div className="space-y-3">
            <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50">
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.email} ({c.email})</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subject..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
            />
            <textarea
              placeholder="Your message..."
              rows={4}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none"
            />
            <button className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] transition-colors">
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5">
      <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function AdminClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#9a9a9a] hover:text-white transition-colors">
        ← Back to Clients
      </button>

      <div className="bg-[#111] rounded-xl p-5 border border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#991930]/20 flex items-center justify-center text-[#991930] text-lg font-bold">
            {(client.name || client.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{client.name || client.email}</h2>
            <p className="text-sm text-[#6b6b6b]">{client.email} • {client.company || 'No company'}</p>
          </div>
          <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
            client.subscription_status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
            client.email_verified ? 'bg-white/10 text-[#9a9a9a]' :
            'bg-[#f59e0b]/20 text-[#f59e0b]'
          }`}>
            {client.subscription_status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.plan}</div>
            <div className="text-[10px] text-[#6b6b6b]">Plan</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.credits}</div>
            <div className="text-[10px] text-[#6b6b6b]">Credits</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.email_verified ? '✅' : '❌'}</div>
            <div className="text-[10px] text-[#6b6b6b]">Verified</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{new Date(client.created_at).toLocaleDateString()}</div>
            <div className="text-[10px] text-[#6b6b6b]">Joined</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-[#991930] text-white text-xs font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
            📧 Send Email
          </button>
          <button className="px-4 py-2 bg-white/5 text-white text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">
            📅 Book Meeting
          </button>
          <button className="px-4 py-2 bg-white/5 text-white text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">
            📊 Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
