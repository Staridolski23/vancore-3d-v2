'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type Meeting = {
  id: string;
  user_name: string;
  user_email: string;
  company: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  created_at: string;
};

export default function AdminCalendar() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch(`${API_URL}/meetings`);
      const data = await res.json();
      setMeetings(data.reverse());
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да отмените тази среща?')) return;
    try {
      await fetch(`${API_URL}/meetings/${id}`, { method: 'DELETE' });
      loadMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const statusLabels: Record<string, string> = { scheduled: 'Запазена', completed: 'Завършена', cancelled: 'Отменена' };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = meetings.filter(m => m.date >= today && m.status !== 'cancelled');
  const past = meetings.filter(m => m.date < today || m.status === 'completed');
  const cancelled = meetings.filter(m => m.status === 'cancelled');

  // Calendar view helpers
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

  const getMeetingsForDate = (date: string) => {
    return meetings.filter(m => m.date === date && m.status !== 'cancelled');
  };

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
          {/* Upcoming */}
          <div>
            <h3 className="text-sm font-semibold text-vancore-light mb-3">📅 Предстоящи срещи ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <div className="glass rounded-2xl p-5 border border-white/5 text-sm text-vancore-muted text-center">Няма предстоящи срещи</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m.id} className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-vancore-light">{m.user_name || 'Клиент'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[m.status]}`}>{statusLabels[m.status]}</span>
                      </div>
                      <p className="text-xs text-vancore-muted">{m.user_email}</p>
                      <p className="text-xs text-vancore-muted">{m.company || 'Без компания'}</p>
                      <p className="text-xs text-vancore-muted mt-1">📅 {m.date} в {m.time}</p>
                      {m.notes && <p className="text-xs text-vancore-muted mt-1 italic">"{m.notes}"</p>}
                    </div>
                    <div className="flex gap-2">
                      {m.status === 'scheduled' && (
                        <>
                          <button onClick={() => updateStatus(m.id, 'completed')} className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-colors">Завърши</button>
                          <button onClick={() => deleteMeeting(m.id)} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">Отмени</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
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
              <div className="text-xs text-vancore-muted">Общо</div>
              <div className="text-2xl font-black text-vancore-gold">{meetings.length}</div>
            </div>
          </div>
        </div>
      ) : (
        /* Calendar month view */
        <div className="glass rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedDate(new Date(year, month - 1, 1).toISOString().split('T')[0])} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10">← Предишен</button>
            <h3 className="text-sm font-bold">{monthNames[month]} {year}</h3>
            <button onClick={() => setSelectedDate(new Date(year, month + 1, 1).toISOString().split('T')[0])} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10">Следващ →</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((d, i) => (
              <div key={d} className={`py-2 font-bold ${i === 0 || i === 6 ? 'text-vancore-muted' : ''}`}>{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="py-2" />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const dayMeetings = getMeetingsForDate(dateStr);
              const isToday = dateStr === today;
              const dayOfWeek = new Date(year, month, day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`py-2 rounded-lg cursor-pointer transition-colors relative ${
                    isToday ? 'bg-vancore-bronze/20 ring-1 ring-vancore-bronze/40' : dayMeetings.length > 0 ? 'bg-vancore-gold/10 hover:bg-vancore-gold/20' : 'hover:bg-white/5'
                  } ${isWeekend ? 'text-vancore-muted' : ''}`}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {dayMeetings.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {dayMeetings.slice(0, 3).map((_, idx) => (
                        <div key={idx} className="w-1 h-1 rounded-full bg-vancore-gold" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-vancore-muted mb-2">Срещи на {selectedDate}:</p>
              {getMeetingsForDate(selectedDate).length === 0 ? (
                <p className="text-xs text-vancore-muted">Няма срещи за тази дата</p>
              ) : (
                <div className="space-y-1">
                  {getMeetingsForDate(selectedDate).map((m) => (
                    <div key={m.id} className="text-xs flex justify-between">
                      <span>{m.time} — {m.user_name || m.user_email}</span>
                      <span className="text-vancore-muted">{m.company || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
