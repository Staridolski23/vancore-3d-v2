'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Meeting = { id: string; user_name: string; user_email: string; company: string; date: string; time: string; notes: string; status: string };

export default function ClientPortal() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
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

  const book = async () => {
    if (!name.trim() || !email.trim() || !selectedSlot) return;
    try {
      const res = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, slot: selectedSlot, name, email, company }) });
      if (!res.ok) throw new Error('failed');
      setConfirmed(selectedSlot);
      setSelectedSlot(null);
    } catch (err) {
      alert('Неуспешно запазване. Опитайте отново.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-black text-center mb-8">Клиентски портал</h1>
        <div className="glass rounded-3xl p-8 border border-white/5 space-y-6">
          <div>
            <label className="block text-xs text-vancore-muted mb-2">Изберете дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-vancore-light" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button key={slot} onClick={() => setSelectedSlot(slot)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${selectedSlot === slot ? 'border-vancore-bronze bg-vancore-bronze/10 text-vancore-light' : 'border-white/10 text-vancore-muted hover:border-vancore-bronze/40'}`}>{slot}</button>
            ))}
            {slots.length === 0 && <div className="text-xs text-vancore-muted col-span-3">Няма свободни часове.</div>}
          </div>

          {selectedSlot && !confirmed && (
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име Фамилия" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Имейл" type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Компания" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-vancore-light" />
              <button onClick={book} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">Запази час</button>
            </div>
          )}

          {confirmed && <p className="text-xs text-green-400 text-center">✅ Часа {confirmed} е запазен. Ще се свържем с вас.</p>}
        </div>
      </div>
    </div>
  );
}
