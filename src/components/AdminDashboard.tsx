'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  status: string;
  joined: string;
  conversations: number;
  clarityScore: number;
  subscription_status: string;
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Zhanet Topalova', email: 'office@vancoresys.com', company: 'VANCORE', plan: 'professional', status: 'active', joined: '2026-06-12', conversations: 12, clarityScore: 78, subscription_status: 'active' },
  { id: '2', name: 'John Smith', email: 'john@acme.com', company: 'Acme Inc', plan: 'starter', status: 'active', joined: '2026-06-20', conversations: 3, clarityScore: 31, subscription_status: 'free' },
  { id: '3', name: 'Maria Petrova', email: 'maria@techcorp.bg', company: 'TechCorp', plan: 'business', status: 'active', joined: '2026-05-15', conversations: 28, clarityScore: 65, subscription_status: 'active' },
  { id: '4', name: 'Ivan Ivanov', email: 'ivan@startup.io', company: 'StartupXYZ', plan: 'starter', status: 'pending', joined: '2026-06-22', conversations: 0, clarityScore: 0, subscription_status: 'free' },
  { id: '5', name: 'Coastal Hotels', email: 'info@hotels.bg', company: 'Coastal Hotel Group', plan: 'payg', status: 'active', joined: '2026-04-10', conversations: 15, clarityScore: 82, subscription_status: 'active' },
  { id: '6', name: 'Metro Retail', email: 'contact@metro.com', company: 'Metro Retail', plan: 'professional', status: 'cancelled', joined: '2026-03-01', conversations: 22, clarityScore: 71, subscription_status: 'cancelled' },
];

const ANALYTICS = {
  totalClients: 156,
  activeSubscriptions: 89,
  monthlyRevenue: 12400,
  retentionRate: 92,
  newThisWeek: 12,
  veraQuestions: 2847,
  veraConversations: 342,
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'analytics' | 'messaging'>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  const filteredClients = MOCK_CLIENTS.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(clientSearch.toLowerCase())
  );

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
      <div className="flex gap-1 bg-[#111] p-1 rounded-lg">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'clients', label: 'Clients', icon: '👥' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
          { key: 'messaging', label: 'Messages', icon: '💬' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
            <MetricCard label="Total Clients" value={ANALYTICS.totalClients.toString()} change={`+${ANALYTICS.newThisWeek} this week`} />
            <MetricCard label="Active Subs" value={ANALYTICS.activeSubscriptions.toString()} change="+8%" positive />
            <MetricCard label="Revenue" value={`€${ANALYTICS.monthlyRevenue.toLocaleString()}`} change="+23%" positive />
            <MetricCard label="Retention" value={`${ANALYTICS.retentionRate}%`} change="+2%" positive />
          </div>

          {/* Vera Usage */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">🤖 Vera AI Usage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{ANALYTICS.veraQuestions.toLocaleString()}</div>
                <div className="text-xs text-[#6b6b6b]">Total Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{ANALYTICS.veraConversations}</div>
                <div className="text-xs text-[#6b6b6b]">Conversations</div>
              </div>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Client Activity</h3>
            <div className="space-y-2">
              {MOCK_CLIENTS.slice(0, 4).map((client) => (
                <div key={client.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#991930]/20 flex items-center justify-center text-[#991930] text-xs font-semibold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-white">{client.name}</div>
                      <div className="text-[10px] text-[#6b6b6b]">{client.company}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    client.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
                    client.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {client.status}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
            />
          </div>

          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b]">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] hidden sm:table-cell">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] hidden md:table-cell">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b]">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#6b6b6b]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{client.name}</div>
                        <div className="text-[10px] text-[#6b6b6b]">{client.email}</div>
                        <div className="text-[10px] text-[#6b6b6b] sm:hidden">{client.plan} • Score: {client.clarityScore}%</div>
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
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#991930] rounded-full" style={{ width: `${client.clarityScore}%` }} />
                          </div>
                          <span className="text-xs text-white">{client.clarityScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          client.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          client.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {client.status}
                        </span>
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
            Showing {filteredClients.length} of {MOCK_CLIENTS.length} clients
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Monthly Revenue" value="€12,400" change="+23% vs last month" positive />
            <MetricCard label="Active Clients" value="89" change="+12 this week" positive />
            <MetricCard label="Churn Rate" value="8%" change="-2%" positive />
            <MetricCard label="Vera Usage" value="2,847" change="+156% this month" positive />
            <MetricCard label="Avg Clarity" value="64%" change="+8pts" positive />
            <MetricCard label="Support Load" value="24" change="-12 tickets" positive />
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Revenue by Plan</h3>
            <div className="space-y-3">
              {[
                { plan: 'Business (€99/mo)', count: 18, revenue: 1782, pct: 14 },
                { plan: 'Professional (€49/mo)', count: 42, revenue: 2058, pct: 17 },
                { plan: 'Pay-As-You-Go (€25)', count: 29, revenue: 725, pct: 6 },
                { plan: 'Free/Starter', count: 67, revenue: 0, pct: 0 },
              ].map((item) => (
                <div key={item.plan} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-[#9a9a9a] truncate">{item.plan}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#991930] rounded-full" style={{ width: `${Math.max(item.pct, 3)}%` }} />
                  </div>
                  <div className="w-20 text-right text-xs text-white">€{item.revenue.toLocaleString()}</div>
                  <div className="w-8 text-right text-[10px] text-[#6b6b6b]">{item.count}</div>
                </div>
              ))}
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
              {MOCK_CLIENTS.map(c => (
                <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
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

function MetricCard({ label, value, change, positive }: { label: string; value: string; change: string; positive?: boolean }) {
  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5">
      <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
      <div className={`text-[10px] mt-1 ${positive ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>{change}</div>
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
            {client.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{client.name}</h2>
            <p className="text-sm text-[#6b6b6b]">{client.email} • {client.company}</p>
          </div>
          <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
            client.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
          }`}>
            {client.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.conversations}</div>
            <div className="text-[10px] text-[#6b6b6b]">Conversations</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.clarityScore}%</div>
            <div className="text-[10px] text-[#6b6b6b]">Clarity Score</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.plan}</div>
            <div className="text-[10px] text-[#6b6b6b]">Plan</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{client.joined}</div>
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
