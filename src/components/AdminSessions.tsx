'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Session = {
  id: string;
  topic: string;
  messages_count: number;
  created_at: string;
};

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions`);
      const data = await res.json();
      setSessions(data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI сесии ({sessions.length})</h2>

      {loading ? (
        <div className="text-center py-12 text-vancore-muted">Зареждане...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-vancore-muted">Няма сесии</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-vancore-bronze/10 flex items-center justify-center text-sm">🤖</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-vancore-light">
                        {new Date(session.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-vancore-muted">
                        {new Date(session.created_at).toLocaleDateString('bg-BG')}
                      </span>
                    </div>
                    <p className="text-sm text-vancore-muted mt-0.5">{session.topic || 'Без тема'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-vancore-muted">{session.messages_count} съобщения</span>
                  <button
                    onClick={() => setSelectedId(session.id)}
                    className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors"
                  >
                    Преглед
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedId(null)}>
          <div className="glass rounded-3xl border border-white/10 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Сесия: {selectedSession.topic || 'Без тема'}</h3>
            <div className="space-y-2 text-sm text-vancore-muted">
              <p><span className="text-vancore-light">ID:</span> {selectedSession.id}</p>
              <p><span className="text-vancore-light">Съобщения:</span> {selectedSession.messages_count}</p>
              <p><span className="text-vancore-light">Дата:</span> {new Date(selectedSession.created_at).toLocaleString('bg-BG')}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedId(null)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10">Затвори</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
