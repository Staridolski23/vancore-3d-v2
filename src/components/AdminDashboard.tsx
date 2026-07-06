'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
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

interface Booking {
  id: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard({ token: propToken }: { token?: string }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'bookings' | 'content' | 'media' | 'analytics' | 'settings'>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalClients: 0, activeSubscriptions: 0, verifiedEmails: 0 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [settings, setSettings] = useState({ siteName: 'VANCORE', contactEmail: 'hello@vancoresys.com', adminEmails: 'momchil@vancore.ai, zhanet@vancore.ai, office@vancoresys.com', username: 'admin' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [proposeMode, setProposeMode] = useState(false);
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('');
  const [addBookingMode, setAddBookingMode] = useState(false);
  const [newBooking, setNewBooking] = useState({ name: '', email: '', phone: '', company: '', date: '', time: '', description: '' });
  const [savingBooking, setSavingBooking] = useState(false);
  const [siteImages, setSiteImages] = useState<{ name: string; url: string }[]>([
    { name: 'Hero Background', url: '/images/hero-bg.svg' },
    { name: 'About Section', url: '/images/about-section.svg' },
    { name: 'Services Icons', url: '/images/services-icons.svg' },
    { name: 'Work Case Studies', url: '/images/work-case-studies.svg' },
    { name: 'Team Photos', url: '/images/team-photos.svg' },
  ]);

  const replaceImage = async (name: string, file: File) => {
    const token = propToken || localStorage.getItem('vancore_client_token') || '';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setSiteImages(prev => prev.map(img => img.name === name ? { ...img, url: data.url } : img));
        alert('Image replaced successfully');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
    fetchContent();
    fetchBookings();
    loadSettings();
  }, [propToken]);

  const loadSettings = async () => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await fetch('/api/adminv2/settings', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings && Object.keys(data.settings).length > 0) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const fetchContent = async () => {
    setLoadingContent(true);
    try {
      const res = await fetch('/api/adminv2/content');
      if (res.ok) { const data = await res.json(); setSiteContent(data.content || []); }
    } catch (e) { console.error('Failed to fetch content:', e); }
    finally { setLoadingContent(false); }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings?upcoming=true');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        const newCount = (data.bookings || []).filter((b: Booking) => b.status === 'new').length;
        setNewBookingCount(newCount);
      }
    } catch (e) { console.error('Failed to fetch bookings:', e); }
  };

  const updateBookingStatus = async (id: number | string, status: string) => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const booking = bookings.find(b => b.id == id);
      await fetch('/api/bookings/' + id, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, date: booking?.date, time: booking?.time }),
      });
      fetchBookings();
    } catch (e) {
      console.error('Failed to update booking:', e);
    }
  };

  const sendProposal = async () => {
    if (!selectedBooking || !proposeDate || !proposeTime) return;
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await fetch('/api/bookings/' + selectedBooking.id + '/propose', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: proposeDate, time: proposeTime }),
      });
      if (res.ok) alert('Proposal sent to client!');
      setProposeMode(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (e) {
      console.error('Failed to send proposal:', e);
    }
  };

  const createBooking = async () => {
    if (!newBooking.name || !newBooking.email || !newBooking.date || !newBooking.time) return;
    setSavingBooking(true);
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBooking, status: 'confirmed' }),
      });
      if (res.ok) {
        alert('Booking created!');
        setAddBookingMode(false);
        setNewBooking({ name: '', email: '', phone: '', company: '', date: '', time: '', description: '' });
        fetchBookings();
      }
    } catch (e) {
      console.error('Failed to create booking:', e);
    } finally {
      setSavingBooking(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await fetch('/api/adminv2/settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchData = async () => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
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
      const res = await fetch('/api/adminv2/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      await fetch('/api/adminv2/clients/' + clientId, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, role: newRole } : c));
      setSelectedClient(prev => prev ? { ...prev, role: newRole } : null);
    } catch (e) {
      console.error('Failed to update client role:', e);
    }
  };

  const updateClientPlan = async (clientId: string, newPlan: string) => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      await fetch('/api/adminv2/clients/' + clientId, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, plan: newPlan } : c));
      setSelectedClient(prev => prev ? { ...prev, plan: newPlan } : null);
    } catch (e) {
      console.error('Failed to update client plan:', e);
    }
  };

  const updateClientCredits = async (clientId: string, credits: number) => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      await fetch('/api/adminv2/clients/' + clientId, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, credits } : c));
      setSelectedClient(prev => prev ? { ...prev, credits } : null);
    } catch (e) {
      console.error('Failed to update client credits:', e);
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
          { key: 'bookings', label: 'Bookings', icon: '📅', badge: newBookingCount },
          { key: 'content', label: 'Site Content', icon: '✏️' },
          { key: 'media', label: 'Media', icon: '🖼️' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === tab.key
                ? 'bg-[#991930] text-white'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {'badge' in tab && tab.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white text-[9px] rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
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
                      <div className="text-[10px] text-[#6b6b6b]">{client.company || 'No company'} {client.phone ? '• ' + client.phone : ''}</div>
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
            <AddContentForm onAdded={fetchContent} />
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

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Mini Calendar View */}
          <AdminBookingsCalendar bookings={bookings} />

          {/* Upcoming Bookings List */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Upcoming Bookings</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddBookingMode(true)}
                  className="px-3 py-1.5 text-xs bg-[#991930] text-white rounded-lg hover:bg-[#a83d1f] transition-colors"
                >
                  + Add Booking
                </button>
                <button
                  onClick={fetchBookings}
                  className="px-3 py-1.5 text-xs text-[#9a9a9a] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm text-[#6b6b6b]">No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold text-white">{new Date(booking.date).getDate()}</div>
                        <div className="text-[10px] text-[#6b6b6b]">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{booking.name}</div>
                        <div className="text-xs text-[#6b6b6b]">{booking.email}</div>
                        {booking.company && <div className="text-xs text-[#6b6b6b]">🏢 {booking.company}</div>}
                        {booking.phone && <div className="text-xs text-[#6b6b6b]">📞 {booking.phone}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#991930]">{booking.time}</div>
                      <div className="text-[10px] text-[#6b6b6b]">{booking.description?.substring(0, 50)}...</div>
                      <div className="flex gap-2 mt-2">
                        {booking.status === 'new' && (
                          <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="px-3 py-1.5 text-xs bg-[#10b981] text-white rounded-lg">
                            Confirm
                          </button>
                        )}
                        <button onClick={() => { setSelectedBooking(booking); setProposeMode(true); }} className="px-3 py-1.5 text-xs bg-[#991930] text-white rounded-lg">
                          Propose Change
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Propose Change Form */}
      {proposeMode && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-white mb-1">Propose Change</h3>
            <p className="text-xs text-[#9a9a9a] mb-4">
              {selectedBooking.name} &lt;{selectedBooking.email}&gt; — current: {selectedBooking.date} @ {selectedBooking.time}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">New date</label>
                <input
                  type="date"
                  value={proposeDate}
                  onChange={(e) => setProposeDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">New time</label>
                <input
                  type="time"
                  value={proposeTime}
                  onChange={(e) => setProposeTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={sendProposal}
                  className="flex-1 px-3 py-2 bg-[#991930] text-white text-sm rounded-lg hover:bg-[#a83d1f] transition-colors"
                >
                  Send Proposal
                </button>
                <button
                  onClick={() => { setProposeMode(false); setSelectedBooking(null); }}
                  className="px-3 py-2 bg-white/5 text-white text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Form */}
      {addBookingMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-white mb-4">New Booking</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">Name</label>
                <input type="text" value={newBooking.name} onChange={e => setNewBooking(s => ({ ...s, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">Email</label>
                <input type="email" value={newBooking.email} onChange={e => setNewBooking(s => ({ ...s, email: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">Phone</label>
                <input type="tel" value={newBooking.phone} onChange={e => setNewBooking(s => ({ ...s, phone: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">Company</label>
                <input type="text" value={newBooking.company} onChange={e => setNewBooking(s => ({ ...s, company: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9a9a9a] block mb-1">Date</label>
                  <input type="date" value={newBooking.date} onChange={e => setNewBooking(s => ({ ...s, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-[#9a9a9a] block mb-1">Time</label>
                  <input type="time" value={newBooking.time} onChange={e => setNewBooking(s => ({ ...s, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1">Description</label>
                <textarea value={newBooking.description} onChange={e => setNewBooking(s => ({ ...s, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" rows={3} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={createBooking} disabled={savingBooking} className="flex-1 px-3 py-2 bg-[#991930] text-white text-sm rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors">
                  {savingBooking ? 'Creating...' : 'Create Booking'}
                </button>
                <button onClick={() => setAddBookingMode(false)} className="px-3 py-2 bg-white/5 text-white text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4">Media Library</h3>
            <p className="text-xs text-[#6b6b6b] mb-4">Upload and manage images used across your website.</p>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center mb-4 hover:border-[#991930]/50 transition-colors">
              <input
                type="file"
                id="media-upload"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  const token = propToken || localStorage.getItem('vancore_client_token') || '';
                  try {
                    const res = await fetch('/api/admin/media', {
                      method: 'POST',
                      headers: { 'Authorization': 'Bearer ' + token },
                      body: formData,
                    });
                    const data = await res.json();
                    if (res.ok && data.url) {
                      setSiteImages(prev => [...prev, { name: file.name, url: data.url }]);
                      alert('Image uploaded successfully');
                    } else {
                      alert(data.error || 'Upload failed');
                    }
                  } catch {
                    alert('Upload failed. Please try again.');
                  }
                }}
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm text-[#9a9a9a]">Click to upload or drag and drop</p>
                <p className="text-[10px] text-[#6b6b6b] mt-1">PNG, JPG, SVG up to 10MB</p>
              </label>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {siteImages.length === 0 ? (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center text-[#6b6b6b] text-xs col-span-full">
                  No images uploaded yet
                </div>
              ) : (
                siteImages.map((img, i) => (
                  <div key={i} className="aspect-square bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Site Images */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Current Site Images</h3>
            <p className="text-xs text-[#6b6b6b] mb-4">Click Replace to update an image. All changes take effect after deployment.</p>
            <div className="space-y-2">
              {siteImages.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-white">{item.name}</span>
                  </div>
                  <label className="px-3 py-1.5 text-xs text-[#991930] border border-[#991930]/30 rounded-lg hover:bg-[#991930]/10 transition-colors cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) replaceImage(item.name, file);
                      }}
                    />
                  </label>
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
                <input
                  type="text"
                  value={settings.siteName || ''}
                  onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Username</label>
                <input
                  type="text"
                  value={settings.username || ''}
                  onChange={e => setSettings(s => ({ ...s, username: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={e => setSettings(s => ({ ...s, contactEmail: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Admin Emails (comma separated)</label>
                <input
                  type="text"
                  value={settings.adminEmails || ''}
                  onChange={e => setSettings(s => ({ ...s, adminEmails: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              {settingsSaved && (
                <p className="text-sm text-green-400">✓ Settings saved successfully!</p>
              )}
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
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
                  {selectedClient.phone && <div className="text-xs text-[#9a9a9a] mt-0.5">📞 {selectedClient.phone}</div>}
                  {selectedClient.company && <div className="text-xs text-[#9a9a9a0]">🏢 {selectedClient.company}</div>}
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
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Plan</label>
                <select
                  value={selectedClient.plan || 'starter'}
                  onChange={(e) => updateClientPlan(selectedClient.id, e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                >
                  <option value="starter">Starter (Free)</option>
                  <option value="professional">Professional (€49/mo)</option>
                  <option value="business">Business (€99/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Credits</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={selectedClient.credits || 0}
                    onChange={(e) => setSelectedClient({ ...selectedClient, credits: parseInt(e.target.value) || 0 })}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50"
                  />
                  <button
                    onClick={() => updateClientCredits(selectedClient.id, selectedClient.credits || 0)}
                    className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1.5">Add Credits</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="add-credits"
                    placeholder="e.g. 10"
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('add-credits') as HTMLInputElement;
                      const amount = parseInt(input.value) || 0;
                      if (amount > 0) {
                        const newCredits = (selectedClient.credits || 0) + amount;
                        setSelectedClient({ ...selectedClient, credits: newCredits });
                        updateClientCredits(selectedClient.id, newCredits);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
                  >
                    + Add
                  </button>
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

function AddContentForm({ onAdded }: { onAdded: () => void }) {
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
        headers: { 'Content-Type': 'application/json' },
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

function AdminBookingsCalendar({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { dayNum: number; date: string; count: number; isToday: boolean; isWeekend: boolean }[] = [];

    const startDay = firstDay.getDay();
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < adjustedStart; i++) {
      days.push({ dayNum: 0, date: '', count: 0, isToday: false, isWeekend: false });
    }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const count = bookings.filter(b => b.date === dateStr).length;
      days.push({
        dayNum: d,
        date: dateStr,
        count,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-[#111] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Bookings Calendar</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="px-2 py-1 text-xs text-[#9a9a9a] hover:text-white bg-white/5 rounded">←</button>
          <span className="text-xs text-white min-w-[100px] text-center">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="px-2 py-1 text-xs text-[#9a9a9a] hover:text-white bg-white/5 rounded">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[10px] text-[#6b6b6b] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            title={day.count > 0 ? `${day.count} booking(s)` : ''}
            className={`
              aspect-square flex flex-col items-center justify-center rounded text-xs
              ${!day.dayNum ? 'invisible' : ''}
              ${day.isWeekend && day.dayNum ? 'bg-[#374151] text-[#6b6b6b]' : ''}
              ${day.count > 0 && !day.isWeekend ? 'bg-[#991930] text-white font-bold' : ''}
              ${day.count === 0 && !day.isWeekend && day.dayNum ? 'bg-white/5 text-[#9a9a9a]' : ''}
              ${day.isToday ? 'ring-2 ring-[#f59e0b]' : ''}
            `}
          >
            {day.dayNum > 0 && (
              <>
                <span>{day.dayNum}</span>
                {day.count > 0 && <span className="text-[7px]">{day.count}</span>}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#991930]"></div><span className="text-[10px] text-[#6b6b6b]">Has bookings</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div><span className="text-[10px] text-[#6b6b6b]">No bookings</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded ring-2 ring-[#f59e0b]"></div><span className="text-[10px] text-[#6b6b6b]">Today</span></div>
      </div>
    </div>
  );
}
