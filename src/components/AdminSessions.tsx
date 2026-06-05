'use client';

import { useState } from 'react';
import SessionDetailsModal from '@/components/SessionDetailsModal';

const sessions = [
  { id: 1, time: '08:32', user: 'Анонимен', topic: 'HoReCa проблеми', messages: 4 },
  { id: 2, time: '10:15', user: 'Анонимен', topic: 'E-commerce логистика', messages: 4 },
  { id: 3, time: '11:42', user: 'Анонимен', topic: 'IT стартап растеж', messages: 4 },
];

export default function AdminSessions() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI сесии ({sessions.length})</h2>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-vancore-bronze/10 flex items-center justify-center text-sm">🤖</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{s.time}</span>
                    <span className="text-xs text-vancore-muted">{s.user}</span>
                  </div>
                  <p className="text-sm text-vancore-muted mt-0.5">{s.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-vancore-muted">{s.messages} съобщения</span>
                <button onClick={() => setSelectedSession(s.id)} className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors">Преглед</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedSession && <SessionDetailsModal session={sessions.find(s => s.id === selectedSession)!} onClose={() => setSelectedSession(null)} />}
    </div>
  );
}
