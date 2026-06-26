'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayStatus {
  date: string;
  dayName: string;
  dayNum: number;
  isWeekend: boolean;
  isPast: boolean;
  allBooked: boolean;
  slots: TimeSlot[];
}

const WORK_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Record<string, string[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    description: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch bookings for current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    fetch(`/api/bookings?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => setBookings(data.bookings || {}))
      .catch(() => {});
  }, [currentMonth]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: DayStatus[] = [];

    // Add empty cells for days before first day of month
    const startDay = firstDay.getDay();
    const adjustedStart = startDay === 0 ? 6 : startDay - 1; // Monday = 0

    for (let i = 0; i < adjustedStart; i++) {
      days.push({ date: '', dayName: '', dayNum: 0, isWeekend: false, isPast: false, allBooked: false, slots: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = dayDate < today;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const bookedSlots = bookings[dateStr] || [];
      const availableSlots = WORK_HOURS.filter(t => !bookedSlots.includes(t));
      const allBooked = !isWeekend && !isPast && availableSlots.length === 0;

      days.push({
        date: dateStr,
        dayName: dayNames[dayOfWeek],
        dayNum: d,
        isWeekend,
        isPast,
        allBooked,
        slots: WORK_HOURS.map(t => ({ time: t, available: !bookedSlots.includes(t) }))
      });
    }

    return days;
  };

  const handleDateClick = (day: DayStatus) => {
    if (day.isWeekend || day.isPast || day.allBooked || !day.date) return;
    setSelectedDate(day.date);
    setSelectedTime(null);
    setShowForm(false);
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          ...formData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book');
      }

      setSubmitted(true);
      // Refresh bookings
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const refreshRes = await fetch(`/api/bookings?year=${year}&month=${month}`);
      const refreshData = await refreshRes.json();
      setBookings(refreshData.bookings || {});
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const selectedDay = days.find(d => d.date === selectedDate);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Book a Call</h2>
        <p className="text-[#9a9a9a]">Select a date and time for your consultation</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#10b981]"></div>
          <span className="text-xs text-[#9a9a9a]">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#ef4444]"></div>
          <span className="text-xs text-[#9a9a9a]">Fully Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#374151]"></div>
          <span className="text-xs text-[#9a9a9a]">Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#1f2937]"></div>
          <span className="text-xs text-[#9a9a9a]">Past</span>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          ← Prev
        </button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#111] rounded-xl border border-white/5 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-xs text-[#6b6b6b] py-2">{day}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                ${!day.date ? 'invisible' : ''}
                ${day.isWeekend ? 'bg-[#374151] text-[#6b6b6b] cursor-not-allowed' : ''}
                ${day.isPast && !day.isWeekend ? 'bg-[#1f2937] text-[#4b5563] cursor-not-allowed' : ''}
                ${day.allBooked && !day.isWeekend && !day.isPast ? 'bg-[#ef4444] text-white cursor-not-allowed' : ''}
                ${!day.isWeekend && !day.isPast && !day.allBooked ? 'bg-[#10b981] text-white cursor-pointer hover:bg-[#059669]' : ''}
                ${selectedDate === day.date ? 'ring-2 ring-[#991930]' : ''}
              `}
            >
              {day.dayNum > 0 && (
                <>
                  <span className="font-medium">{day.dayNum}</span>
                  {day.allBooked && !day.isWeekend && !day.isPast && (
                    <span className="text-[8px] mt-0.5">Full</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && selectedDay && (
        <div className="mt-6 bg-[#111] rounded-xl border border-white/5 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Available times for {selectedDay.dayName}, {selectedDate}
          </h4>
          {selectedDay.slots.filter(s => s.available).length === 0 ? (
            <p className="text-sm text-[#ef4444]">No available slots for this day</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeClick(slot.time)}
                  disabled={!slot.available}
                  className={`
                    py-2 px-3 rounded-lg text-xs font-medium transition-all
                    ${slot.available
                      ? 'bg-[#10b981] text-white hover:bg-[#059669] cursor-pointer'
                      : 'bg-[#374151] text-[#6b6b6b] cursor-not-allowed'
                    }
                    ${selectedTime === slot.time ? 'ring-2 ring-[#991930]' : ''}
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Form */}
      {showForm && selectedDate && selectedTime && !submitted && (
        <div className="mt-6 bg-[#111] rounded-xl border border-white/5 p-6">
          <h4 className="text-sm font-semibold text-white mb-4">
            Book: {selectedDay?.dayName}, {selectedDate} at {selectedTime}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Full name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+359 888 123 456"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#9a9a9a] mb-1">What would you like to discuss? *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the topic you'd like to discuss..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] transition-colors"
            >
              Confirm Booking
            </button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {submitted && (
        <div className="mt-6 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <h4 className="text-lg font-semibold text-white mb-2">Booking Confirmed!</h4>
          <p className="text-sm text-[#9a9a9a]">
            Your call is scheduled for {selectedDay?.dayName}, {selectedDate} at {selectedTime}.
            We'll send you a confirmation email shortly.
          </p>
          <button
            onClick={() => { setSubmitted(false); setShowForm(false); setSelectedTime(null); setFormData({ name: '', email: '', phone: '', company: '', description: '' }); }}
            className="mt-4 text-sm text-[#991930] hover:underline"
          >
            Book another call
          </button>
        </div>
      )}
    </div>
  );
}
