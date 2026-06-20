'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function BookingCalendar() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(`${API_URL}/calendar?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [date]);

  const bookSlot = async (slot: string) => {
    const name = prompt('Име и фамилия:');
    if (!name) return;
    const email = prompt('Имейл:');
    if (!email) return;

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, name, email }),
      });
      if (!res.ok) throw new Error('failed');
      setConfirmed(slot);
    } catch (err) {
      alert('Неуспешно запазване. Опитайте отново.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Запазване на час</h2>
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-vancore-muted">Изберете дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-vancore-light"
          />
        </div>

        {loading ? (
          <div className="text-sm text-vancore-muted">Зареждане...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${selectedSlot === slot ? 'border-vancore-bronze bg-vancore-bronze/10 text-vancore-light' : 'border-white/10 text-vancore-muted hover:border-vancore-bronze/40'}`}
              >
                {slot}
              </button>
            ))}
            {slots.length === 0 && <div className="text-xs text-vancore-muted">Няма свободни часове.</div>}
          </div>
        )}

        {selectedSlot && !confirmed && (
          <button onClick={() => bookSlot(selectedSlot)} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#991930] to-[#991930] text-vancore-dark font-semibold">
            Запази {selectedSlot}
          </button>
        )}
        {confirmed && (
          <div className="text-xs text-green-400">✅ Часа {confirmed} е запазен.</div>
        )}
      </div>
    </div>
  );
}
