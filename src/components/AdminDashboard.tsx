'use client';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import AdminInbox from '@/components/AdminInbox';
import AdminClientEditor from '@/components/AdminClientEditor';
import type { AdminClient as Client } from '@/lib/account-types';

import { useState, useEffect, useRef } from 'react';
import { validDate, validTime } from '@/lib/booking-policy';
import { LayoutGrid, Users, Calendar, FileText, BarChart3, Settings, Image as ImageIcon, Users as UsersIcon, CreditCard, CheckCircle, TrendingUp, Star } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'bookings' | 'content' | 'media' | 'analytics' | 'settings' | 'reviews' | 'inbox'>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalClients: 0, activeSubscriptions: 0, verifiedEmails: 0 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [clientsError, setClientsError] = useState('');
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending_approval' | 'published' | 'rejected'>('all');
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
  const bookingRunning = useRef(false);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const reviewRunning = useRef(false);
  const reviewGeneration = useRef(0);
  const bookingDialog = useRef<HTMLDivElement>(null);
  const bookingBusy = useRef(false);
  bookingBusy.current = savingBooking;
  useEffect(() => {
    if (!proposeMode && !addBookingMode) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = bookingDialog.current;
    const controls = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled])') || [])];
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !bookingBusy.current) { event.preventDefault(); setProposeMode(false); setAddBookingMode(false); }
      if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items[items.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [proposeMode, addBookingMode]);
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
      const res = await authenticatedFetch('/api/admin/media', {
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
    fetchReviews();
  }, [propToken]);

  useEffect(() => {
    fetchReviews();
  }, [reviewFilter]);

  const loadSettings = async () => {
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await authenticatedFetch('/api/adminv2/settings', {
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
    setContentError('');
    try {
      const res = await authenticatedFetch('/api/adminv2/content', { headers: { Authorization: 'Bearer ' + (propToken || localStorage.getItem('vancore_client_token') || '') } });
      if (!res.ok) throw new Error('Content unavailable');
      const data = await res.json(); setSiteContent(data.content || []);
    } catch { setContentError('Content could not be loaded. Please retry before editing.'); }
    finally { setLoadingContent(false); }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true); setBookingsError(''); setBookingNotice('');
    try {
      const res = await authenticatedFetch('/api/bookings?upcoming=true', { headers: { Authorization: 'Bearer ' + (propToken || localStorage.getItem('vancore_client_token') || '') } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data.bookings) || !data.bookings.every((b: Booking) => b && b.id != null && typeof b.date === 'string' && typeof b.time === 'string' && typeof b.status === 'string')) throw new Error();
      setBookings(data.bookings);
      setNewBookingCount(data.bookings.filter((b: Booking) => b.status === 'new').length);
      return data.bookings as Booking[];
    } catch { setBookingsError('Bookings could not be loaded. Previously loaded records are retained. Please refresh.'); return null; }
    finally { setBookingsLoading(false); }
  };

  const fetchReviews = async () => {
    const generation = ++reviewGeneration.current;
    setReviewsLoading(true); setReviewsError(''); setReviewNotice('');
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await authenticatedFetch('/api/reviews?' + new URLSearchParams({ status: reviewFilter }).toString(), {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data.reviews) || !data.reviews.every((r: any) => r && r.id != null && typeof r.status === 'string' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5)) throw new Error();
      if (reviewGeneration.current === generation) setReviews(data.reviews);
      return data.reviews as any[];
    } catch { if (reviewGeneration.current === generation) setReviewsError('Reviews could not be loaded. Previously loaded records are retained. Please refresh.'); return null; }
    finally { if (reviewGeneration.current === generation) setReviewsLoading(false); }
  };

  const bookingAction = async (path: string, method: string, body: object, success: string, onSaved?: () => void) => {
    if (bookingRunning.current) return;
    bookingRunning.current = true; setSavingBooking(true); setBookingError(''); setBookingNotice('');
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await authenticatedFetch(path, {
        method,
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookingError(res.status === 409 ? 'The booking conflicts with the current schedule. Refresh and review your draft before retrying.' : 'The request was rejected. Your draft is still here.');
        return;
      }
      if (data.success !== true) throw new Error();
      onSaved?.();
      const refreshed = await fetchBookings();
      setBookingNotice(success + (refreshed ? '' : ' The saved request was acknowledged, but the list could not be refreshed. Refresh before submitting again.'));
    } catch { setBookingError('The result could not be confirmed. Refresh before submitting again; your draft is still here.'); }
    finally { bookingRunning.current = false; setSavingBooking(false); }
  };
  const updateBookingStatus = (id: number | string, status: string) => bookingAction('/api/bookings/' + id, 'PUT', { status }, 'Booking update saved.');

  const sendProposal = async () => {
    if (!selectedBooking || !validDate(proposeDate) || !validTime(proposeTime)) { setBookingError('Choose a valid proposal date and time.'); return; }
    await bookingAction('/api/bookings/' + selectedBooking.id + '/propose', 'POST', { date: proposeDate, time: proposeTime }, 'Proposal saved for review. The appointment time is unchanged; email delivery is not confirmed.', () => { setProposeMode(false); setSelectedBooking(null); setProposeDate(''); setProposeTime(''); });
  };

  const createBooking = async () => {
    if (!newBooking.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newBooking.email.trim()) || !validDate(newBooking.date) || !validTime(newBooking.time)) { setBookingError('Enter a name, valid email, date and time.'); return; }
    await bookingAction('/api/bookings', 'POST', newBooking, 'Booking request created. Confirm it separately after reviewing the schedule.', () => { setAddBookingMode(false); setNewBooking({ name: '', email: '', phone: '', company: '', date: '', time: '', description: '' }); });
  };

  const moderateReview = async (id: number | string, status: 'published' | 'rejected') => {
    if (reviewRunning.current) return;
    reviewRunning.current = true; setReviewBusy(true); setReviewNotice('');
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await authenticatedFetch('/api/reviews/' + encodeURIComponent(id), {
        method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setReviewNotice('The review change was rejected. Refresh and try again.'); return; }
      if (data.success !== true) throw new Error();
      const current = await fetchReviews();
      setReviewNotice(current ? 'Review change saved; the list has been refreshed.' : 'The review change was acknowledged, but the list could not be refreshed. Refresh before submitting again.');
    } catch { setReviewNotice('The review result could not be confirmed. Refresh before submitting again.'); }
    finally { reviewRunning.current = false; setReviewBusy(false); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      const res = await authenticatedFetch('/api/adminv2/settings', {
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
    setMetricsError(''); setClientsError('');
    try {
      const token = propToken || localStorage.getItem('vancore_client_token') || '';
      if (!token) { setLoading(false); return; }
      const headers: any = { 'Authorization': 'Bearer ' + token };

      try {
        const res = await authenticatedFetch('/api/adminv2', { headers });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (![data.totalClients, data.activeSubscriptions, data.verifiedEmails].every(value => Number.isInteger(value) && value >= 0)) throw new Error();
        setMetrics(data);
      } catch { setMetricsError('Dashboard metrics could not be loaded. Please retry.'); }

      try {
        const clientsRes = await authenticatedFetch('/api/adminv2/clients', { headers });
        if (!clientsRes.ok) throw new Error();
        const data = await clientsRes.json();
        if (!Array.isArray(data.clients) || !data.clients.every((item: Client) => item && typeof item.id === 'string' && typeof item.email === 'string')) throw new Error();
        setClients(data.clients);
      } catch { setClientsError('Client accounts could not be loaded. Please retry.'); }
    } catch (e) {
      setClientsError('Administrator data could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!editingContent) return;
    setSaving(true);
    setContentError('');
    try {
      const res = await authenticatedFetch('/api/adminv2/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('vancore_client_token') || '') },
        body: JSON.stringify({ id: editingContent.id, value: editValue }),
      });
      if (res.ok) {
        setSiteContent(prev => prev.map(c => c.id === editingContent.id ? { ...c, value: editValue, updated_at: new Date().toISOString() } : c));
        setEditingContent(null);
        setEditValue('');
      } else {
        setContentError('Content could not be saved. Your edit is still open.');
      }
    } catch {
      setContentError('Content could not be saved. Your edit is still open.');
    } finally {
      setSaving(false);
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
          { key: 'dashboard', label: 'Dashboard', icon: <LayoutGrid key="dashboard-icon" className="w-4 h-4" /> },
          { key: 'clients', label: 'Clients', icon: <Users key="clients-icon" className="w-4 h-4" /> },
          { key: 'inbox', label: 'Enquiries', icon: <FileText key="inbox-icon" className="w-4 h-4" /> },
          { key: 'bookings', label: 'Bookings', icon: <Calendar key="bookings-icon" className="w-4 h-4" />, badge: newBookingCount },
          { key: 'content', label: 'Site Content', icon: <FileText key="content-icon" className="w-4 h-4" /> },
          { key: 'media', label: 'Media', icon: <ImageIcon key="media-icon" className="w-4 h-4" /> },
          { key: 'analytics', label: 'Analytics', icon: <BarChart3 key="analytics-icon" className="w-4 h-4" /> },
          { key: 'settings', label: 'Settings', icon: <Settings key="settings-icon" className="w-4 h-4" /> },
          { key: 'reviews', label: 'Reviews', icon: <Star key="reviews-icon" className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            aria-label={tab.label}
            aria-pressed={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 shrink-0 min-w-[44px] min-h-[44px] py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === tab.key
                ? 'bg-[#991930] text-white'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-1 flex items-center justify-center">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {'badge' in tab && tab.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white text-[9px] rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'inbox' && <AdminInbox token={propToken} />}
      {(metricsError || clientsError) && <div role="alert" className="text-sm text-red-300"><p>{metricsError}</p><p>{clientsError}</p><button onClick={fetchData} className="underline">Retry administrator data</button></div>}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Clients" value={metricsError ? '—' : String(metrics.totalClients || 0)} icon={<UsersIcon className="w-5 h-5" />} />
            <MetricCard label="Active Subs" value={metricsError ? '—' : String(metrics.activeSubscriptions || 0)} icon={<CreditCard className="w-5 h-5" />} />
            <MetricCard label="Verified" value={metricsError ? '—' : String(metrics.verifiedEmails || 0)} icon={<CheckCircle className="w-5 h-5" />} />
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
      {activeTab === 'clients' && !clientsError && (
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
            <p className="text-xs text-[#6b6b6b] mb-4">Edit your website content here. Saved changes appear when the page is reloaded.</p>
            {contentError && <div role="alert" className="text-sm text-red-400 mb-4">{contentError} <button onClick={fetchContent} className="underline">Retry</button></div>}
            {loadingContent && <p className="text-sm text-[#9a9a9a]">Loading content...</p>}

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
                {siteContent.length === 0 && !loadingContent && !contentError && (
                  <div className="text-sm text-[#6b6b6b] text-center py-8">No content items found. Add some below.</div>
                )}
              </div>
            )}
          </div>

          {/* Add New Content */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Add New Content</h3>
            {!loadingContent && !contentError && <AddContentForm onAdded={fetchContent} />}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && !metricsError && !clientsError && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Total Clients" value={String(metrics.totalClients || 0)} icon={<UsersIcon className="w-5 h-5" />} />
            <MetricCard label="Active Subs" value={String(metrics.activeSubscriptions || 0)} icon={<CreditCard className="w-5 h-5" />} />
            <MetricCard label="Verified" value={String(metrics.verifiedEmails || 0)} icon={<CheckCircle className="w-5 h-5" />} />
            <MetricCard label="Conversion" value={(metrics.totalClients || 0) > 0 ? Math.round(((metrics.activeSubscriptions || 0) / metrics.totalClients) * 100) + '%' : '0%'} icon={<TrendingUp className="w-5 h-5" />} />
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
          {bookingNotice && <p role="status" className="text-sm text-white">{bookingNotice}</p>}
          {bookingError && !proposeMode && !addBookingMode && <p role="alert" className="text-sm text-red-300">{bookingError}</p>}
          {bookingsError && <p role="alert" className="text-sm text-red-300">{bookingsError}</p>}
          {bookingsLoading && <p role="status" className="text-sm text-white">Loading bookings…</p>}
          {/* Mini Calendar View */}
          <AdminBookingsCalendar bookings={bookings} />

          {/* Upcoming Bookings List */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Upcoming Bookings</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { setBookingError(''); setAddBookingMode(true); }} disabled={savingBooking || bookingsLoading || !!bookingsError}
                  className="px-3 py-1.5 text-xs bg-[#991930] text-white rounded-lg hover:bg-[#a83d1f] transition-colors"
                >
                  + Add Booking
                </button>
                <button
                  onClick={fetchBookings} disabled={savingBooking || bookingsLoading}
                  className="px-3 py-1.5 text-xs text-[#9a9a9a] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
            {bookings.length === 0 && !bookingsLoading && !bookingsError ? (
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
                          <button disabled={savingBooking || bookingsLoading || !!bookingsError} onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="px-3 py-1.5 text-xs bg-[#10b981] text-white rounded-lg disabled:opacity-50">
                            Confirm
                          </button>
                        )}
                        <button disabled={savingBooking || bookingsLoading || !!bookingsError || ['cancelled', 'completed'].includes(booking.status)} onClick={() => { setBookingError(''); setProposeDate(''); setProposeTime(''); setSelectedBooking(booking); setProposeMode(true); }} className="px-3 py-1.5 text-xs bg-[#991930] text-white rounded-lg disabled:opacity-50">
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
          <div ref={bookingDialog} role="dialog" aria-modal="true" aria-labelledby="proposal-title" className="bg-[#111] rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
            <h3 id="proposal-title" className="text-base font-semibold text-white mb-1">Propose Change</h3>
            <p className="text-xs text-[#9a9a9a] mb-4">
              {selectedBooking.name} &lt;{selectedBooking.email}&gt; — current: {selectedBooking.date} @ {selectedBooking.time}
            </p>
            {bookingError && <p role="alert" className="text-sm text-red-300 mb-3">{bookingError}</p>}
            <fieldset disabled={savingBooking} className="space-y-3">
              <div>
                <label htmlFor="proposal-date" className="text-xs text-[#9a9a9a] block mb-1">New date</label>
                <input
                  id="proposal-date" type="date"
                  value={proposeDate}
                  onChange={(e) => setProposeDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="proposal-time" className="text-xs text-[#9a9a9a] block mb-1">New time</label>
                <input
                  id="proposal-time" type="time"
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
                  {savingBooking ? 'Saving…' : 'Save Proposal'}
                </button>
                <button
                  onClick={() => { setProposeMode(false); setSelectedBooking(null); }}
                  className="px-3 py-2 bg-white/5 text-white text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {/* Add Booking Form */}
      {addBookingMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div ref={bookingDialog} role="dialog" aria-modal="true" aria-labelledby="new-booking-title" className="bg-[#111] rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
            <h3 id="new-booking-title" className="text-base font-semibold text-white mb-4">New Booking</h3>
            {bookingError && <p role="alert" className="text-sm text-red-300 mb-3">{bookingError}</p>}
            <fieldset disabled={savingBooking} className="space-y-3">
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-name">Name</label>
                <input id="admin-booking-name" type="text" value={newBooking.name} onChange={e => setNewBooking(s => ({ ...s, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-email">Email</label>
                <input id="admin-booking-email" type="email" value={newBooking.email} onChange={e => setNewBooking(s => ({ ...s, email: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-phone">Phone</label>
                <input id="admin-booking-phone" type="tel" value={newBooking.phone} onChange={e => setNewBooking(s => ({ ...s, phone: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-company">Company</label>
                <input id="admin-booking-company" type="text" value={newBooking.company} onChange={e => setNewBooking(s => ({ ...s, company: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-date">Date</label>
                  <input id="admin-booking-date" type="date" value={newBooking.date} onChange={e => setNewBooking(s => ({ ...s, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-time">Time</label>
                  <input id="admin-booking-time" type="time" value={newBooking.time} onChange={e => setNewBooking(s => ({ ...s, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9a9a9a] block mb-1" htmlFor="admin-booking-description">Description</label>
                <textarea id="admin-booking-description" value={newBooking.description} onChange={e => setNewBooking(s => ({ ...s, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" rows={3} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={createBooking} disabled={savingBooking} className="flex-1 px-3 py-2 bg-[#991930] text-white text-sm rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors">
                  {savingBooking ? 'Creating...' : 'Create Booking'}
                </button>
                <button onClick={() => setAddBookingMode(false)} className="px-3 py-2 bg-white/5 text-white text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
              </div>
            </fieldset>
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
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  const token = propToken || localStorage.getItem('vancore_client_token') || '';
                  try {
                    const res = await authenticatedFetch('/api/admin/media', {
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
                <p className="text-[10px] text-[#6b6b6b] mt-1">PNG, JPG, WebP or GIF up to 10MB</p>
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
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
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
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
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

      {selectedClient && <AdminClientEditor key={selectedClient.id} client={selectedClient} token={propToken}
        onClose={() => setSelectedClient(null)}
        onUpdated={saved => {
          const next = clients.map(item => item.id === saved.id ? { ...item, ...saved } : item);
          setClients(next);
          setMetrics({ totalClients: next.length, activeSubscriptions: next.filter(item => item.plan !== 'starter' && item.subscription_status === 'active').length, verifiedEmails: next.filter(item => item.email_verified).length });
          setSelectedClient(previous => previous?.id === saved.id ? { ...previous, ...saved } : previous);
        }}
        onBookMeeting={() => { setNewBooking({ name: selectedClient.name || '', email: selectedClient.email, phone: selectedClient.phone || '', company: selectedClient.company || '', date: '', time: '', description: '' }); setActiveTab('bookings'); setAddBookingMode(true); setSelectedClient(null); }} />}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviewNotice && <p role="status" className="text-sm text-white">{reviewNotice}</p>}
          {reviewsError && <p role="alert" className="text-sm text-red-300">{reviewsError}</p>}
          {reviewsLoading && <p role="status" className="text-sm text-white">Loading reviews…</p>}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Client Reviews</h3>
              <button disabled={reviewBusy || reviewsLoading} onClick={fetchReviews} className="px-3 py-2 text-sm text-white border border-white/20 rounded">Refresh reviews</button>
              <select aria-label="Review status" disabled={reviewBusy} value={reviewFilter} onChange={e => setReviewFilter(e.target.value as any)} className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#991930]/50">
                <option value="all">All</option>
                <option value="pending_approval">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {reviews.length === 0 && !reviewsLoading && !reviewsError ? (
              <p className="text-xs text-[#6b6b6b]">No reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {reviews.filter(r => reviewFilter === 'all' || r.status === reviewFilter).map((review: any) => (
                  <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-sm text-white">{review.title || 'Untitled'}</div>
                        <div className="text-xs text-[#9a9a9a]">{'⭐'.repeat(review.rating || 0)} {review.user_id}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${review.status === 'published' ? 'bg-[#10b981]/20 text-[#10b981]' : review.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{review.status}</span>
                    </div>
                    <div className="text-xs text-[#6b6b6b] mb-2">{review.body}</div>
                    {review.status !== 'published' && review.status !== 'rejected' && (
                      <div className="flex gap-2">
                        <button disabled={reviewBusy || reviewsLoading || !!reviewsError} onClick={() => moderateReview(review.id, 'published')} className="px-3 py-2 bg-[#10b981] text-white text-xs rounded-lg hover:bg-[#059669] disabled:opacity-50">Approve</button>
                        <button disabled={reviewBusy || reviewsLoading || !!reviewsError} onClick={() => moderateReview(review.id, 'rejected')} className="px-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
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
      await authenticatedFetch('/api/adminv2/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('vancore_client_token') || '') },
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
