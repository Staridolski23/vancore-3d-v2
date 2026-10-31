'use client';
import { authenticatedFetch, signOut } from '@/lib/authenticated-fetch';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'documents' | 'reports' | 'history' | 'billing' | 'settings'>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentError, setDocumentError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [profileDraft, setProfileDraft] = useState({ name: '', company: '', phone: '', vat_id: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<{id: string; role: string; content: string}[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [penaltyWarning, setPenaltyWarning] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState('');
  const searchParams = useSearchParams();

  // Check if coming from Vera with plan selection
  const planParam = searchParams.get('plan');
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');

  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (token) {
      authenticatedFetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            setUser(data.user);
            setProfileDraft({ name: data.user.name || '', company: data.user.company || '', phone: data.user.phone || '', vat_id: data.user.vat_id || '' });
            setStatus('dashboard');
            if (planParam) {
              setActiveTab('billing');
            }
            // Fetch bookings
            authenticatedFetch('/api/bookings?email=' + data.user.email)
              .then(r => { if (!r.ok) throw new Error(); return r.json(); })
              .then(data => setBookings(data.bookings || []))
              .catch(() => setDataErrors(previous => ({ ...previous, bookings: 'Your bookings could not be loaded. Please reload to retry.' })));
            // Fetch documents
            authenticatedFetch('/api/documents?email=' + data.user.email)
              .then(r => { if (!r.ok) throw new Error(); return r.json(); })
              .then(data => setDocuments(data.documents || []))
              .catch(() => setDataErrors(previous => ({ ...previous, documents: 'Your documents could not be loaded. Please reload to retry.' })));
            // Fetch reviews
            authenticatedFetch('/api/reviews?user_id=' + data.user.id)
              .then(r => { if (!r.ok) throw new Error(); return r.json(); })
              .then(data => setReviews(data.reviews || []))
              .catch(() => setDataErrors(previous => ({ ...previous, reviews: 'Your reviews could not be loaded. Please reload to retry.' })));
          });
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('vancore_client_token');
          setStatus('login');
        } else {
          setProfileLoadError('Your profile could not be loaded. Please retry.');
        }
      }).catch(() => {
        setProfileLoadError('Your profile could not be loaded. Please retry.');
      });
    } else {
      setStatus('login');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'history' || !user) return;
    let current = true;
    setLoadingMessages(true);
    authenticatedFetch('/api/chat').then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (current) {
        setMessages(data.messages || []);
        setDataErrors(previous => { const next = { ...previous }; delete next.history; return next; });
      }
    }).catch(() => { if (current) setDataErrors(previous => ({ ...previous, history: 'Your messages could not be loaded. Please reload to retry.' })); })
      .finally(() => { if (current) setLoadingMessages(false); });
    return () => { current = false; };
  }, [activeTab, user?.id]);

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMessage('');
    try {
      const response = await authenticatedFetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-profile', ...profileDraft }) });
      if (!response.ok) throw new Error();
      setUser(previous => previous ? { ...previous, ...profileDraft } : previous);
      setProfileMessage('Profile saved.');
    } catch { setProfileMessage('Your profile could not be saved. Please try again.'); }
    finally { setSavingProfile(false); }
  };

  const logout = async () => {
    try { await signOut(); } catch { window.alert('Unable to sign out. Please retry.'); return; }
    setUser(null);
    localStorage.removeItem('vancore_client_token');
    localStorage.removeItem('vancore_client_bearer');
    setStatus('login');
  };

  const downloadDocument = async (doc: any) => {
    setDocumentError('');
    try {
      const response = await authenticatedFetch('/api/documents/' + encodeURIComponent(doc.filename));
      if (!response.ok) throw new Error('Download failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDocumentError('The document could not be downloaded. Please try again.');
    }
  };

  const downloadICS = (booking: any) => {
    try {
      const dateStr = String(booking.date || '').trim();
      const timeStr = String(booking.time || '').trim();
      if (!dateStr || !timeStr) return;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      const start = new Date(year || 1970, (month || 1) - 1, day || 1, hour || 0, minute || 0);
      const end = new Date(start.getTime() + (60 * 60 * 1000));
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatDT = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//VANCORE//NONSGML Client Portal//EN',
        'BEGIN:VEVENT',
        `DTSTART:${formatDT(start)}`,
        `DTEND:${formatDT(end)}`,
        `SUMMARY:VANCORE Consultation`,
        `DESCRIPTION:Booked consultation via vancoresys.com`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vancore-booking-${dateStr}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ICS download failed', e);
    }
  };

  const submitReview = async () => {
    if (!reviewBody.trim()) return;
    setSubmittingReview(true);
    setReviewMessage('');
    try {
      const token = localStorage.getItem('vancore_client_token');
      const res = await authenticatedFetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          user_id: user?.id,
          booking_id: null,
          rating: reviewRating,
          title: reviewTitle.trim() || null,
          body: reviewBody.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewTitle('');
        setReviewBody('');
        setReviewRating(5);
        setReviewMessage('Thanks! Your review is awaiting approval.');
        authenticatedFetch('/api/reviews?user_id=' + user?.id)
          .then(r => r.json())
          .then(data => setReviews(data.reviews || []))
          .catch(() => {});
      } else {
        setReviewMessage(data.error || 'Failed to submit review.');
      }
    } catch (e) {
      setReviewMessage('Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const parseDateTime = (dateStr: string, timeStr: string) => {
    const d = String(dateStr || '').trim();
    const t = String(timeStr || '').trim();
    if (!d || !t) return null;
    const [year, month, day] = d.split('-').map(Number);
    const [hour, minute] = t.split(':').map(Number);
    return new Date(year || 1970, (month || 1) - 1, day || 1, hour || 0, minute || 0);
  };

  const confirmBooking = async (id: string | number) => {
    const token = localStorage.getItem('vancore_client_token');
    const response = await authenticatedFetch('/api/bookings/' + id, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed', confirmed_at: new Date().toISOString() }),
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); window.alert(error.error || 'Unable to update the booking. Please try again.'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', confirmed_at: new Date().toISOString() } : b));
  };

  const cancelBooking = async (id: string | number, dateStr: string, timeStr: string) => {
    const when = parseDateTime(dateStr, timeStr);
    const now = new Date();
    let penalty = false;
    if (when) {
      const hoursUntil = (when.getTime() - now.getTime()) / (1000 * 60 * 60);
      penalty = hoursUntil < 24;
    }
    const reason = window.prompt('Please provide a reason for cancellation') || '';
    if (!reason) return;
    const token = localStorage.getItem('vancore_client_token');
    const response = await authenticatedFetch('/api/bookings/' + id, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', cancellation_reason: reason, penalty_applied: penalty }),
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); window.alert(error.error || 'Unable to update the booking. Please try again.'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled', cancellation_reason: reason, penalty_applied: penalty } : b));
    setPenaltyWarning(penalty ? 'This booking was cancelled less than 24h before the session. A penalty may apply.' : null);
  };

  const requestBookingChange = async (id: string | number) => {
    const newDate = prompt('New date (YYYY-MM-DD)');
    if (!newDate) return;
    const newTime = prompt('New time (HH:MM)');
    if (!newTime) return;
    const token = localStorage.getItem('vancore_client_token');
    const response = await authenticatedFetch('/api/bookings/' + id + '/propose', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, time: newTime, status: 'rescheduled' }),
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); window.alert(error.error || 'Unable to update the booking. Please try again.'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rescheduled' } : b));
  };

  const generateReport = async (): Promise<string> => {
    try {
      const res = await authenticatedFetch('/api/ai-analyst', {
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
        {profileLoadError ? <div role="alert" className="text-sm text-red-400">{profileLoadError} <button onClick={() => window.location.reload()} className="underline">Retry</button></div> : <div className="text-[#6b6b6b] text-sm">Loading...</div>}
      </div>
    );
  }

  if (status === 'login') {
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
    return null;
  }

  const currentPlan = user?.plan || 'starter';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {Object.entries(dataErrors).map(([key, message]) => <p key={key} role="alert" className="text-sm text-red-400">{message}</p>)}
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#111] p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: '📋' },
          { key: 'bookings', label: 'My Bookings', icon: '📅' },
          { key: 'reviews', label: 'Reviews', icon: '⭐' },
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
                <div className="text-sm text-[#9a9a9a]">Assessment pending</div>
              </div>
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
                <div className="text-xl font-bold text-white">—</div>
                <div className="text-[10px] text-[#6b6b6b] uppercase">Reports</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-xl font-bold text-white">{dataErrors.bookings ? '—' : bookings.filter(booking => booking.status !== 'cancelled').length}</div>
                <div className="text-[10px] text-[#6b6b6b] uppercase">Bookings</div>
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
            <button onClick={() => setActiveTab('reviews')} className="p-4 bg-[#111] rounded-xl border border-white/5 hover:border-[#991930]/30 transition-colors text-center group">
              <div className="text-2xl mb-2">⭐</div>
              <div className="text-sm text-white font-medium group-hover:text-[#991930] transition-colors">Reviews</div>
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
            {dataErrors.bookings ? null : bookings.length === 0 ? (
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
                    {booking.status === 'confirmed' && (
                      <button onClick={() => downloadICS(booking)} className="text-xs text-[#991930] hover:underline mt-2">
                        Add to Calendar
                      </button>
                    )}
                    {booking.status === 'new' && (
                      <button onClick={() => confirmBooking(booking.id)} className="text-xs text-[#10b981] hover:underline mt-2">
                        Confirm
                      </button>
                    )}
                    {(booking.status === 'new' || booking.status === 'confirmed') && (
                      <>
                        <button onClick={() => requestBookingChange(booking.id)} className="text-xs text-[#3b82f6] hover:underline mt-2 ml-3">
                          Request change
                        </button>
                        <button onClick={() => cancelBooking(booking.id, booking.date, booking.time)} className="text-xs text-red-400 hover:underline mt-2 ml-3">
                          Cancel
                        </button>
                      </>
                    )}
                    {penaltyWarning && <p className="text-xs text-red-400 mt-2">{penaltyWarning}</p>}
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
            {documentError && <p role="alert" className="text-sm text-red-400 mb-4">{documentError}</p>}
            {dataErrors.documents ? null : documents.length === 0 ? (
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
                    <button onClick={() => downloadDocument(doc)} className="text-xs text-[#991930] hover:underline">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Write a Review</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Rating</label>
                <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Title</label>
                <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Short headline" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Review</label>
                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} rows={4} placeholder="Share your experience working with VANCORE..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none" />
              </div>
              <button onClick={submitReview} disabled={submittingReview} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors disabled:opacity-50">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              {reviewMessage && <p className="text-xs text-[#9a9a9a]">{reviewMessage}</p>}
            </div>
          </div>
          <div className="bg-[#111] rounded-xl p-6 border border-white/5">
            <h3 className="text-base font-semibold text-white mb-4">Your Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#6b6b6b]">You haven't submitted any reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-white">{review.title || 'Untitled'}</div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${review.status === 'published' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-yellow-500/20 text-yellow-400'}`}>{review.status}</span>
                    </div>
                    <div className="text-xs text-[#9a9a9a]">{'⭐'.repeat(review.rating || 0)}</div>
                    <div className="text-xs text-[#6b6b6b] mt-1">{review.body}</div>
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
            <h3 className="text-base font-semibold text-white mb-4">Messages with VANCORE</h3>
            <p className="text-xs text-[#9a9a9a] mb-4">Messages sent to the VANCORE team through the client portal.</p>
            {loadingMessages && <p className="text-sm text-[#9a9a9a]">Loading messages...</p>}
            {messages.map(message => <div key={message.id} className="border-b border-white/10 py-3"><p className="text-xs text-[#9a9a9a]">{message.role === 'user' ? 'You' : 'VANCORE team'}</p><p className="text-sm text-white whitespace-pre-wrap">{message.content}</p></div>)}
            {!loadingMessages && !dataErrors.history && messages.length === 0 && <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-[#6b6b6b] mb-4">No portal messages yet.</p>
              <a href="/ai-analyst" className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
                Start an AI Analysis
              </a>
            </div>}
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
                <input type="text" value={profileDraft.name} onChange={event => setProfileDraft(previous => ({ ...previous, name: event.target.value }))} name="name" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Email</label>
                <input type="email" defaultValue={user?.email || ''} disabled className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#6b6b6b]" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                <input type="text" value={profileDraft.company} onChange={event => setProfileDraft(previous => ({ ...previous, company: event.target.value }))} name="company" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">VAT ID</label>
                <input type="text" value={profileDraft.vat_id} onChange={event => setProfileDraft(previous => ({ ...previous, vat_id: event.target.value }))} name="vat_id" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-1">Phone</label>
                <input type="tel" value={profileDraft.phone} onChange={event => setProfileDraft(previous => ({ ...previous, phone: event.target.value }))} name="phone" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#991930]/50" />
              </div>
              <button onClick={saveProfile} disabled={savingProfile} className="px-4 py-2 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors">
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              {profileMessage && <p role="status" className="text-sm text-[#9a9a9a]">{profileMessage}</p>}
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
                  const res = await authenticatedFetch('/api/auth', {
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
