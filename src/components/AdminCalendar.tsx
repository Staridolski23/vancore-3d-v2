'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Meeting = { id: string; user_name: string; user_email: string; company: string; date: string; time: string; notes: string; status: string };

export default function AdminCalendar() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_URL}/meetings`);
      const data = await res.json();
      setMeetings(data.reverse());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/meetings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      fetchMeetings();
    } catch (err) { console.error(err); }
  };

  const cancelMeeting = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да отмените тази среща?')) return;
    try {
      await fetch(`${API_URL}/meetings/${id}`, { method: 'DELETE' });
      fetchMeetings();
    } catch (err) { console.error(err); }
  };

  const statusStyles: Record<string, string> = { scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30', completed: 'bg-green-500/20 text-green-400 border-green-500/30', cancelled: 'bg-red-500/20 text-red-400 border-red-500/30' };
  const statusLabels: Record<string, string> = { scheduled: 'Запазена', completed: 'Завършена', cancelled: 'Отменена' };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = meetings.filter(m => m.date >= today && m.status !== 'cancelled');
  const past = meetings.filter(m => m.date < today || m.status === 'completed');
  const cancelled = meetings.filter(m => m.status === 'cancelled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Календар на срещи ({meetings.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'list' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'bg-white/5 text-vancore-muted'}`}>Списък</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'bg-white/5 text-vancore-muted'}`}>Календар</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-vancore-light mb-3">📅 Предстоящи срещи ({upcoming.length})</h3>
            {upcoming.length === 0 ? <div className="glass rounded-2xl p-5 border border-white/5 text-sm text-vancore-muted text-center">Няма предстоящи срещи</div> : (
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m.id} className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-vancore-light">{m.user_name || 'Клиент'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusStyles[m.status]}`}>{statusLabels[m.status]}</span>
                      </div>
                      <p className="text-xs text-vancore-muted">{m.user_email}</p>
                      <p className="text-xs text-vancore-muted">{m.company || 'Без компания'}</p>
                      <p className="text-xs text-vancore-muted mt-1">📅 {m.date} в {m.time}</p>
                      {m.notes && <p className="text-xs text-vancore-muted mt-1 italic">"{m.notes}"</p>}
                    </div>
                    {m.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(m.id, 'completed')} className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20">Завърши</button>
                        <button onClick={() => cancelMeeting(m.id)} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20">Отмени</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <div className="text-xs text-vancore-muted">Предстоящи</div>
              <div className="text-2xl font-black text-vancore-gold">{upcoming.length}</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <div className="text-xs text-vancore-muted">Завършени</div>
              <div className="text-2xl font-black text-vancore-gold">{past.filter(m => m.status === 'completed').length}</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <div className="text-xs text-vancore-muted">Отменени</div>
              <div className="text-2xl font-black text-vancore-gold">{cancelled.length}</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <div className="text-xs text-vancore-muted">Всички</div>
              <div className="text-2xl font-black text-vancore-gold">{meetings.length}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 border border-white/5 text-sm text-vancore-muted text-center">Календарът е в разработка. Използвайте спиъчния изглед.</div>
      )}
    </div>
  );
}
