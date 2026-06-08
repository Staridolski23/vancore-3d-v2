'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Activity = { id: string; action: string; target: string; user: string; time: string };

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/activity`);
      const data = await res.json();
      setLogs(data.reverse());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Дейности ({logs.length})</h2>
      {loading ? <div className="text-center py-12 text-vancore-muted">Зареждане...</div> : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass rounded-xl p-4 border border-white/5 text-sm text-vancore-muted">
              <span className="text-vancore-light font-semibold">{log.action}</span> — {log.target} ({log.user}, {log.time})
            </div>
          ))}
          {logs.length === 0 && <div className="text-center py-12 text-vancore-muted">Няма записи</div>}
        </div>
      )}
    </div>
  );
}
