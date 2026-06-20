'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Incoming = { id: string; sender_name: string; sender_email: string; type: string; subject: string; message: string; created_at: string };

export default function AdminInbox() {
  const [items, setItems] = useState<Incoming[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInbox(); }, []);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_URL}/incoming`);
      const data = await res.json();
      setItems(data.reverse());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const replyMail = (sender_email: string, subject: string) => {
    const body = encodeURIComponent('Благодаря за вашето запитване. Ще се свържем с вас скоро.');
    window.open(`mailto:${sender_email}?subject=Re: ${encodeURIComponent(subject)}&body=${body}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Входящи ({items.length})</h2>
        <button onClick={fetchInbox} className="px-3 py-1.5 glass border border-white/10 text-xs text-vancore-muted rounded-lg hover:text-vancore-light">Обнови</button>
      </div>
      {loading ? <div className="text-center py-12 text-vancore-muted">Зареждане...</div> : (
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
                  <p className="text-sm text-vancore-muted mt-1">{item.message}</p>
                  <p className="text-[10px] text-vancore-muted mt-2">{new Date(item.created_at).toLocaleString('bg-BG')}</p>
                </div>
                <button
                  onClick={() => replyMail(item.sender_email, item.subject)}
                  className="px-3 py-2 bg-gradient-to-r from-[#991930] to-[#991930] text-vancore-dark rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
                >
                  Отговори с имейл
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-vancore-muted">Няма входящи съобщения</div>}
        </div>
      )}
    </div>
  );
}
