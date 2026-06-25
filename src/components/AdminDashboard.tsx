'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  role?: string;
  subscription_status: string;
  created_at: string;
  email_verified: number;
  credits: number;
}

interface DashboardMetrics {
  totalClients: number;
  activeSubscriptions: number;
  verifiedEmails: number;
}

interface SiteContent {
  id: string;
  section: string;
  key: string;
  value: string;
  type: 'text' | 'textarea' | 'image';
  updated_at: string;
}

export default function AdminDashboard({ token: propToken }: { token?: string }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'content' | 'analytics' | 'settings'>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalClients: 0, activeSubscriptions: 0, verifiedEmails: 0 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [propToken]);

  const fetchData = async () => {
    try {
      const token = propToken || localStorage.getItem('vancore_admin_token') || '';
      if (!token) { setLoading(false); return; }
      const headers: any = { 'Authorization': 'Bearer ' + token };

      try {
        const res = await fetch('/api/adminv2', { headers });
        if (res.ok) { const data = await res.json(); setMetrics(data); }
      } catch (e) { console.error('Failed to fetch metrics:', e); }

      try {
        const clientsRes = await fetch('/api/adminv2/clients', { headers });
        if (clientsRes.ok) { const data = await clientsRes.json(); setClients(data.clients || []); }
      } catch (e) { console.error('Failed to fetch clients:', e); }

      try {
        const contentRes = await fetch('/api/adminv2/content', { headers });
        if (contentRes.ok) { const data = await contentRes.json(); setSiteContent(data.content || []); }
      } catch (e) { console.error('Failed to fetch content:', e); }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!editingContent) return;
    setSaving(true);
    try {
      const token = propToken || localStorage.getItem('vancore_admin_token') || '';
      const res = await fetch('/api/adminv2/content', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingContent.id, value: editValue }),
      });
      if (res.ok) {
        setSiteContent(prev => prev.map(c => c.id === editingContent.id ? { ...c, value: editValue, updated_at: new Date().toISOString() } : c));
        setEditingContent(null);
        setEditValue('');
      }
    } catch (e) {
      console.error('Failed to save content:', e);
    } finally {
      setSaving(false);
    }
  };

  const updateClientRole = async (clientId: string, newRole: string) => {
    try {
      const token = propToken || localStorage.getItem('vancore_admin_token') || '';
      await fetch('/api/adminv2/clients/' + clientId, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, role: newRole } : c));
    } catch (e) {
      console.error('Failed to update client:', e);
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#111] p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'clients', label: 'Clients', icon: '👥' },
          { key: 'content', label: 'Site Content', icon: '✏️' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Clients" value={String(metrics.totalClients || 0)} icon="👥" />
            <MetricCard label="Active Subs" value={String(metrics.activeSubscriptions || 0)} icon="💳" />
            <MetricCard label="Verified" value={String(metrics.verifiedEmails || 0)} icon="✅" />
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

          {/* Quick Actions */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setActiveTab('content')} className="p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                <div className="text-xl mb-1">✏️</div>
                <div className="text-xs text-white">Edit Content</div>
              </button>
              <button onClick={() => setActiveTab('clients')} className="p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                <div className="text-xl mb-1">👥</div>
                <div className="text-xs text-white">Manage Clients</div>
              </button>
              <button onClick={() => setActiveTab('analytics')} className="p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                <div className="text-xl mb-1">📈</div>
                <div className="text-xs text-white">View Analytics</div>
              </button>
              <button onClick={() => setActiveTab('settings')} className="p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                <div className="text-xl mb-1">⚙️</div>
                <div className="text-xs text-white">Settings</div>
              </button>
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
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          client.plan === 'business' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                          client.plan === 'professional' ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
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

      {/* Site Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4">Site Content Editor</h3>
            <p className="text-xs text-[#6b6b6b] mb-4">Edit the content of your website directly from here. Changes are saved to the database and reflected on the site after the next deployment.</p>

            {editingContent ? (
              <div className="space-y-3 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{editingContent.section} / {editingContent.key}</div>
                    <div className="text-[10px] text-[#6b6b6b]">Last updated: {new Date(editingContent.updated_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => { setEditingContent(null); setEditValue(''); }} className="text-xs text-[#6b6b6b] hover:text-white">Cancel</button>
                </div>
                {editingContent.type === 'textarea' ? (
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={4}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                  />
                )}
                <button
                  onClick={saveContent}
                  disabled={saving}
                  className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {siteContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{item.section} / {item.key}</div>
                      <div className="text-xs text-[#6b6b6b] truncate">{item.value}</div>
                    </div>
                    <button
                      onClick={() => { setEditingContent(item); setEditValue(item.value); }}
                      className="ml-3 px-3 py-1.5 bg-white/5 text-white text-xs rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
                {siteContent.length === 0 && (
                  <div className="text-sm text-[#6b6b6b] text-center py-8">No content items found. Add some below.</div>
                )}
              </div>
            )}
          </div>

          {/* Add New Content */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Add New Content</h3>
            <AddContentForm token={propToken || ''} onAdded={fetchData} />
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Clients" value={String(metrics.totalClients || 0)} icon="👥" />
            <MetricCard label="Active Subs" value={String(metrics.activeSubscriptions || 0)} icon="💳" />
            <MetricCard label="Verified" value={String(metrics.verifiedEmails || 0)} icon="✅" />
            <MetricCard label="Conversion" value={(metrics.totalClients || 0) > 0 ? Math.round(((metrics.activeSubscriptions || 0) / metrics.totalClients) * 100) + '%' : '0%'} icon="📈" />
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Plan Distribution</h3>
            <div className="space-y-3">
              {['starter', 'professional', 'business'].map((plan) => {
                const count = clients.filter(c => c.plan === plan).length;
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#9a9a9a] capitalize">{plan}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#991930] rounded-full" style={{ width: Math.max(pct, 3) + '%' }} />
                    </div>
                    <div className="w-12 text-right text-xs text-white">{count} ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Registration Timeline</h3>
            <div className="space-y-2">
              {getRegistrationTimeline(clients).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-[#9a9a9a]">{item.month}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#991930] rounded-full" style={{ width: Math.max(item.pct, 3) + '%' }} />
                  </div>
                  <div className="w-8 text-right text-xs text-white">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Site Name</label>
                <input type="text" defaultValue="VANCORE" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Contact Email</label>
                <input type="email" defaultValue="hello@vancoresys.com" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Admin Emails (comma separated)</label>
                <input type="text" defaultValue="momchil@vancore.ai, zhanet@vancore.ai, office@vancoresys.com" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <button className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Save Settings
              </button>
            </div>
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Starter', price: '€0/mo', features: '5 credits, Basic analysis' },
                { name: 'Professional', price: '€49/mo', features: '50 credits, Full analysis, Priority support' },
                { name: 'Business', price: '€99/mo', features: 'Unlimited credits, Custom solutions, Dedicated manager' },
              ].map((plan) => (
                <div key={plan.name} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-sm font-semibold text-white">{plan.name}</div>
                  <div className="text-lg font-bold text-[#991930] my-2">{plan.price}</div>
                  <div className="text-xs text-[#6b6b6b]">{plan.features}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Danger Zone</h3>
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div>
                <div className="text-sm text-white">Clear all cached data</div>
                <div className="text-[10px] text-[#6b6b6b]">Force all users to reload the latest version</div>
              </div>
              <button className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Client Details</h3>
              <button onClick={() => setSelectedClient(null)} className="text-[#6b6b6b] hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#991930]/20 flex items-center justify-center text-[#991930] text-lg font-bold">
                  {(selectedClient.name || selectedClient.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{selectedClient.name || selectedClient.email}</div>
                  <div className="text-sm text-[#6b6b6b]">{selectedClient.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-[#6b6b6b]">Plan</div>
                  <div className="text-sm text-white">{selectedClient.plan}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-[#6b6b6b]">Status</div>
                  <div className="text-sm text-white">{selectedClient.subscription_status}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-[#6b6b6b]">Credits</div>
                  <div className="text-sm text-white">{selectedClient.credits}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-[#6b6b6b]">Joined</div>
                  <div className="text-sm text-white">{new Date(selectedClient.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Role</label>
                <select
                  value={selectedClient.role || 'client'}
                  onChange={(e) => updateClientRole(selectedClient.id, e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                  📧 Send Email
                </button>
                <button className="flex-1 px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                  📅 Book Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5">
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function AddContentForm({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [section, setSection] = useState('hero');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'text' | 'textarea'>('text');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !value) return;
    setSaving(true);
    try {
      await fetch('/api/adminv2/content', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, key, value, type }),
      });
      setKey('');
      setValue('');
      onAdded();
    } catch (e) {
      console.error('Failed to add content:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Section</label>
          <select value={section} onChange={e => setSection(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#991930]/50">
            <option value="hero">Hero</option>
            <option value="about">About</option>
            <option value="services">Services</option>
            <option value="contact">Contact</option>
            <option value="footer">Footer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value as 'text' | 'textarea')} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#991930]/50">
            <option value="text">Text</option>
            <option value="textarea">Long Text</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#6b6b6b] mb-1">Key</label>
        <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="e.g. title, subtitle" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
      </div>
      <div>
        <label className="block text-xs text-[#6b6b6b] mb-1">Value</label>
        <textarea value={value} onChange={e => setValue(e.target.value)} rows={2} placeholder="Content value..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none" />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors">
        {saving ? 'Adding...' : 'Add Content'}
      </button>
    </form>
  );
}

function getRegistrationTimeline(clients: Client[]) {
  const months: Record<string, number> = {};
  clients.forEach(c => {
    const d = new Date(c.created_at);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months[key] = (months[key] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(months), 1);
  return Object.entries(months).map(([month, count]) => ({
    month,
    count,
    pct: Math.round((count / maxCount) * 100),
  }));
}
