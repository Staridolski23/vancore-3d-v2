'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';

type Incoming = { id: string; sender_name: string; sender_email: string; type: string; subject: string; message: string; created_at: string; notification_status?: string | null };

export default function AdminInbox({ token }: { token?: string }) {
  const [items, setItems] = useState<Incoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const fetchInbox = useCallback(async () => {
    const requestGeneration = ++generation.current;
    setLoading(true); setError('');
    try {
      const res = await authenticatedFetch('/api/adminv2/incoming', token ? { headers: { Authorization: 'Bearer ' + token } } : {});
      if (!res.ok) throw new Error('Enquiries unavailable');
      const data = await res.json();
      if (!Array.isArray(data.messages)) throw new Error('Invalid enquiries response');
      if (generation.current === requestGeneration) setItems(data.messages);
    } catch { if (generation.current === requestGeneration) setError('Enquiries could not be loaded. Please retry.'); }
    finally { if (generation.current === requestGeneration) setLoading(false); }
  }, [token]);
  useEffect(() => { void fetchInbox(); return () => { generation.current++; }; }, [fetchInbox]);

  const replyMail = (sender_email: string, subject: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender_email) || /[\r\n]/.test(sender_email)) return;
    const body = encodeURIComponent('Благодаря за вашето запитване. Ще се свържем с вас скоро.');
    window.location.href = `mailto:${encodeURIComponent(sender_email)}?subject=${encodeURIComponent('Re: ' + subject.replace(/[\r\n]/g, ' ').slice(0, 200))}&body=${body}`;
  };

  return (
    <div className="space-y-4 text-vancore-light">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Enquiries ({items.length})</h2>
        <button onClick={fetchInbox} disabled={loading} className="px-3 py-1.5 glass border border-white/10 text-xs text-vancore-muted rounded-lg hover:text-vancore-light disabled:opacity-50">Refresh enquiries</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {items.some(item => item.notification_status === 'queued' || item.notification_status === 'failed') && <p className="text-sm text-amber-300">Some email notifications are pending. These enquiries are saved here and can be handled directly.</p>}
      {loading ? <div className="text-center py-12 text-vancore-muted">Loading enquiries…</div> : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-vancore-light">{item.sender_name || 'Анонимен'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-vancore-muted">{item.type}</span>
                  </div>
                  <p className="text-xs text-vancore-muted">{item.sender_email}</p>
                  <h4 className="text-sm font-semibold mt-2">{item.subject}</h4>
                  <p className="text-sm text-vancore-muted mt-1 whitespace-pre-wrap break-words">{item.message}</p>
                  <p className="text-[10px] text-vancore-muted mt-2">{new Date(item.created_at).toLocaleString('bg-BG')}</p>
                </div>
                <button
                  onClick={() => replyMail(item.sender_email, item.subject)}
                  className="px-3 py-2 bg-[#991930] text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
                >
                  Reply in email app
                </button>
              </div>
            </div>
          ))}
          {!error && items.length === 0 && <div className="text-center py-12 text-vancore-muted">No enquiries yet.</div>}
        </div>
      )}
    </div>
  );
}
