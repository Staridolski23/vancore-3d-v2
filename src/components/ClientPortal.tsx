'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type Meeting = {
  id: string;
  date: string;
  time: string;
  status: string;
  notes: string;
};

type User = {
  id: string;
  email: string;
  company?: string;
};

export default function ClientPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) loadMeetings();
  }, [user]);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (res.ok) setUser(await res.json());
    } catch (e) {
      // not logged in
    } finally {
      setLoading(false);
    }
  };

  const loadMeetings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/meetings`);
      const data = await res.json();
      // Filter only this user's meetings
      const userMeetings = data.filter((m: any) => m.user_id === user.id);
      setMeetings(userMeetings.reverse());
    } catch (e) {
      console.error(e);
    }
  };

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`${API_URL}/meetings/available?date=${selectedDate}`);
      const available = await res.json();
      setSlots(available);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (user) loadSlots();
  }, [selectedDate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, company };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Грешка');
      setUser(data);
      setEmail('');
      setPassword('');
      setCompany('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setMeetings([]);
      setSlots([]);
    }
  };

  const bookSlot = async (time: string) => {
    if (!user) return;
    setBooking(true);
    try {
      await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          user_name: user.email,
          company: user.company || '',
          date: selectedDate,
          time,
          notes,
        }),
      });
      setBooked(true);
      setNotes('');
      loadMeetings();
      loadSlots();
      setTimeout(() => setBooked(false), 3000);
    } catch (e) {
      alert('Грешка при запазване. Опитайте отново.');
    } finally {
      setBooking(false);
    }
  };

  const cancelMeeting = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да отмените тази среща?')) return;
    try {
      await fetch(`${API_URL}/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      loadMeetings();
      loadSlots();
    } catch (e) {
      alert('Грешка при отменяне.');
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5">
        <p className="text-sm text-vancore-muted">Зареждане...</p>
      </div>
    );
  }

  if (user) {
    const upcoming = meetings.filter(m => m.status === 'scheduled' && m.date >= new Date().toISOString().split('T')[0]);
    const past = meetings.filter(m => m.status === 'completed' || m.date < new Date().toISOString().split('T')[0]);

    return (
      <div className="glass rounded-3xl border border-white/5 p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-2xl font-bold">Добре дошли, {user.email}</h3>
            {user.company && <p className="text-sm text-vancore-muted">{user.company}</p>}
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors">Изход</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className="text-xs text-vancore-muted mb-1">Предстоящи срещи</div>
            <div className="text-2xl font-black text-vancore-gold">{upcoming.length}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className="text-xs text-vancore-muted mb-1">Завършени</div>
            <div className="text-2xl font-black text-vancore-gold">{past.length}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className="text-xs text-vancore-muted mb-1">Общо</div>
            <div className="text-2xl font-black text-vancore-gold">{meetings.length}</div>
          </div>
        </div>

        {/* Booking */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold">Запазване на консултация</h4>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <label className="block text-xs text-vancore-muted mb-1">Дата</label>
              <input
                type="date"
                min={tomorrow.toISOString().split('T')[0]}
                max={maxDate.toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setBooked(false);
                }}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40"
              />
            </div>
            {booked && <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">✅ Срещата е запазена успешно!</span>}
          </div>

          <div>
            <label className="block text-xs text-vancore-muted mb-2">Налични часове за {selectedDate}</label>
            {loadingSlots ? (
              <div className="text-sm text-vancore-muted py-4 text-center">Зареждане...</div>
            ) : slots.length === 0 ? (
              <div className="text-sm text-vancore-muted py-4 text-center">Няма свободни часове за тази дата</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {slots.map((time) => (
                  <button
                    key={time}
                    disabled={booking}
                    onClick={() => bookSlot(time)}
                    className="py-2.5 rounded-xl text-xs font-semibold bg-vancore-bronze/10 text-vancore-gold border border-vancore-bronze/20 hover:bg-vancore-bronze/20 transition-all"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-vancore-muted mb-1">Допълнителни бележки (опционално)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Опишете какво искате да обсъдим..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40"
            />
          </div>
        </div>

        {/* Meetings history */}
        {meetings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-bold">Моите срещи</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {meetings.map((m) => (
                <div key={m.id} className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        m.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        m.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {m.status === 'scheduled' ? 'Запазена' : m.status === 'completed' ? 'Завършена' : 'Отменена'}
                      </span>
                    </div>
                    <p className="text-sm text-vancore-light">📅 {m.date} в {m.time}</p>
                    {m.notes && <p className="text-xs text-vancore-muted mt-1 italic">"{m.notes}"</p>}
                  </div>
                  {m.status === 'scheduled' && (
                    <button onClick={() => cancelMeeting(m.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">Отмени</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5 max-w-md mx-auto space-y-4">
      <h3 className="text-lg font-bold text-center">Клиентски портал</h3>
      <div className="flex rounded-lg bg-white/5 p-1">
        <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Вход</button>
        <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Регистрация</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Имейл</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Парола</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-xs text-vancore-muted mb-1">Компания (опционално)</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </button>
      </form>
    </div>
  );
}
