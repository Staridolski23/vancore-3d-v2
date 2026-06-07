'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type Slot = {
  time: string;
  available: boolean;
};

export default function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; company?: string } | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedDate) loadSlots();
  }, [selectedDate]);

  const checkUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (res.ok) setUser(await res.json());
    } catch (e) {
      // not logged in
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/meetings/available?date=${selectedDate}`);
      const available = await res.json();
      // Generate all slots and mark unavailable
      const allSlots: Slot[] = [];
      for (let h = 9; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
          const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          allSlots.push({ time, available: available.includes(time) });
        }
      }
      setSlots(allSlots);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (time: string) => {
    if (!user) {
      alert('Моля, влезте в профила си, за да запазите среща.');
      return;
    }
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
          notes
        }),
      });
      setBooked(true);
      loadSlots();
      setTimeout(() => setBooked(false), 3000);
    } catch (e) {
      alert('Грешка при запазване. Опитайте отново.');
    } finally {
      setBooking(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="glass rounded-3xl border border-white/5 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Запазване на безплатна консултация</h3>
        <p className="text-sm text-vancore-muted">Изберете дата и час. Заетите timeslot-ове не могат да се запазват.</p>
      </div>

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

      {!user && (
        <p className="text-xs text-vancore-muted text-center">⚠️ Не сте влезли. <a href="/client-portal" className="text-vancore-gold underline">Влезте</a> или се регистрирайте, за да запазите среща.</p>
      )}

      <div>
        <label className="block text-xs text-vancore-muted mb-2">Налични часове за {selectedDate}</label>
        {loading ? (
          <div className="text-sm text-vancore-muted py-4 text-center">Зареждане на часове...</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available || booking}
                onClick={() => slot.available && bookSlot(slot.time)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  slot.available
                    ? 'bg-vancore-bronze/10 text-vancore-gold border border-vancore-bronze/20 hover:bg-vancore-bronze/20'
                    : 'bg-white/5 text-vancore-muted line-through cursor-not-allowed opacity-50'
                }`}
              >
                {slot.time}
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

      <p className="text-[10px] text-vancore-muted text-center">Консултацията е безплатна и продължава 30 минути. Ще ви изпратим имейл потвърждение.</p>
    </div>
  );
}
