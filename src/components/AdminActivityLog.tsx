'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/activity`)
      .then(res => res.json())
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const colorMap: Record<string, string> = {
    lead_created: 'text-green-400',
    meeting_booked: 'text-blue-400',
    message_sent: 'text-vancore-bronze',
    login: 'text-emerald-400',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Дневник на дейностите</h2>
      {loading ? (
        <p className="text-sm text-vancore-muted">Зареждане...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-vancore-muted">Няма записи.</p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-vancore-light">{log.user_email || 'Система'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 ${colorMap[log.action] || 'text-vancore-muted'}`}>{log.action}</span>
                </div>
                <p className="text-xs text-vancore-muted">{log.details || '-'}</p>
              </div>
              <p className="text-[10px] text-vancore-muted">{new Date(log.created_at).toLocaleString('bg-BG')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
