'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { WORK_HOURS, companyClock, DURATION_MINUTES, TIME_ZONE } from '@/lib/booking-policy';

interface TimeSlot {
  time: string;
  available: boolean;
  isPast: boolean;
}

interface DayStatus {
  date: string;
  dayName: string;
  dayNum: number;
  isWeekend: boolean;
  isPast: boolean;
  isToday: boolean;
  allBooked: boolean;
  slots: TimeSlot[];
}

function getMinutesFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2000,0,1));
  const [ready, setReady] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const [year,month] = companyClock().date.split('-').map(Number);
    setCurrentMonth(new Date(year,month-1,1));
    setReady(true);
  }, []);

  // Fetch bookings for current month
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    setAvailabilityError('');
    setSelectedDate(null); setSelectedTime(null); setShowForm(false);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    fetch(`/api/bookings?year=${year}&month=${month}`,{signal:controller.signal})
      .then(res => { if(!res.ok)throw new Error('Availability unavailable');return res.json(); })
      .then(data => {if(!controller.signal.aborted)setBookings(data.bookings || {});})
      .catch(() => {if(!controller.signal.aborted){setBookings({});setAvailabilityError('Availability could not be loaded. Please reload before choosing a time.');}})
      .finally(() => {if(!controller.signal.aborted)setAvailabilityLoading(false);});
    return () => controller.abort();
  }, [currentMonth,ready]);

  // Fetch user profile if logged in
  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (token) {
      authenticatedFetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            setIsLoggedIn(true);
            setUserProfile(data.user);
            setFormData(prev => ({
              ...prev,
              name: data.user.name || prev.name,
              email: data.user.email || prev.email,
              phone: data.user.phone || prev.phone,
              company: data.user.company || prev.company,
            }));
          });
        }
      }).catch(() => {});
    }
  }, []);

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
      days.push({ date: '', dayName: '', dayNum: 0, isWeekend: false, isPast: false, isToday: false, allBooked: false, slots: [] });
    }

    const clock = companyClock();
    const todayStr = clock.date;
    const currentTimeMinutes = clock.minutes;

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const bookedSlots = bookings[dateStr] || [];
      
      // For today, filter out past time slots
      const availableSlots = WORK_HOURS.filter(t => {
        if (bookedSlots.includes(t)) return false;
        if (isToday) {
          return getMinutesFromTime(t) > currentTimeMinutes;
        }
        return true;
      });
      
      const allBooked = !isWeekend && !isPast && availableSlots.length === 0;

      days.push({
        date: dateStr,
        dayName: dayNames[dayOfWeek],
        dayNum: d,
        isWeekend,
        isPast,
        isToday,
        allBooked,
        slots: WORK_HOURS.map(t => ({
          time: t,
          available: !bookedSlots.includes(t) && (!isToday || getMinutesFromTime(t) > currentTimeMinutes),
          isPast: isToday && getMinutesFromTime(t) <= currentTimeMinutes
        }))
      });
    }

    return days;
  };

  const handleDateClick = (day: DayStatus) => {
    if (availabilityLoading || availabilityError || day.isWeekend || day.isPast || day.allBooked || !day.date) return;
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
    if (submitting || availabilityLoading || availabilityError) return;
    setError('');

    if (!formData.name || !formData.email || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authenticatedFetch('/api/bookings', {
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
      try {
        const refreshRes = await fetch(`/api/bookings?year=${year}&month=${month}`);
        if (!refreshRes.ok) throw new Error('Availability refresh failed');
        const refreshData = await refreshRes.json();
        setBookings(refreshData.bookings || {});
      } catch {
        setAvailabilityError('Your request was saved, but availability could not be refreshed. Please reload before booking again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const selectedDay = days.find(d => d.date === selectedDate);

  if (!ready) return <p role="status">Loading calendar...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Book a Call</h2>
        <p className="text-[#9a9a9a]">Select a date and time for your consultation</p>
        <p className="text-sm text-[#9a9a9a] mt-2">{DURATION_MINUTES} minutes · All times in {TIME_ZONE}</p>
      </div>
      {availabilityError && <p role="alert" className="text-red-300 mb-4">{availabilityError}</p>}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 justify-center">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 rounded bg-[#10b981]"></div>
          <span className="text-[10px] sm:text-xs text-[#9a9a9a]">Available</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 rounded bg-[#ef4444]"></div>
          <span className="text-[10px] sm:text-xs text-[#9a9a9a]">Fully Booked</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 rounded bg-[#374151]"></div>
          <span className="text-[10px] sm:text-xs text-[#9a9a9a]">Weekend</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 rounded ring-1 ring-[#f59e0b]"></div>
          <span className="text-[10px] sm:text-xs text-[#9a9a9a]">Today</span>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="px-2 sm:px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          ←
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="px-2 sm:px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#111] rounded-xl border border-white/5 p-2 sm:p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-[9px] sm:text-xs text-[#6b6b6b] py-1 sm:py-2">{day}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day, i) => (
            <button
              key={i}
              type="button"
              aria-label={day.date || 'Empty date'}
              aria-pressed={selectedDate === day.date}
              disabled={availabilityLoading || Boolean(availabilityError) || !day.date || day.isWeekend || day.isPast || day.allBooked}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded text-xs sm:text-sm transition-all min-h-[32px] sm:min-w-[40px]
                ${!day.date ? 'invisible' : ''}
                ${day.isToday && !day.isWeekend && !day.allBooked ? 'bg-[#10b981] text-white cursor-pointer hover:bg-[#059669] ring-2 ring-[#f59e0b]' : ''}
                ${day.isWeekend ? 'bg-[#374151] text-[#6b6b6b] cursor-not-allowed' : ''}
                ${day.isPast && !day.isWeekend ? 'bg-[#1f2937] text-[#4b5563] cursor-not-allowed' : ''}
                ${day.allBooked && !day.isWeekend && !day.isPast ? 'bg-[#ef4444] text-white cursor-not-allowed' : ''}
                ${!day.isWeekend && !day.isPast && !day.allBooked && !day.isToday ? 'bg-[#10b981] text-white cursor-pointer hover:bg-[#059669]' : ''}
                ${selectedDate === day.date ? 'ring-2 ring-[#991930]' : ''}
              `}
            >
              {day.dayNum > 0 && (
                <>
                  <span className="font-medium">{day.dayNum}</span>
                  {day.isToday && !day.isWeekend && (
                    <span className="text-[6px] sm:text-[7px] mt-0.5 font-bold text-[#f59e0b]">TODAY</span>
                  )}
                  {day.allBooked && !day.isWeekend && !day.isPast && !day.isToday && (
                    <span className="text-[6px] sm:text-[8px] mt-0.5">Full</span>
                  )}
                </>
              )}
            </button>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => !availabilityLoading && !availabilityError && !submitted && slot.available && handleTimeClick(slot.time)}
                  disabled={!slot.available || availabilityLoading || Boolean(availabilityError) || submitted}
                  className={`
                    py-3 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all
                    ${slot.available && !availabilityLoading && !availabilityError && !submitted
                      ? 'bg-[#10b981] text-white hover:bg-[#059669] cursor-pointer active:scale-95'
                      : slot.isPast
                        ? 'bg-[#1f2937] text-[#4b5563] cursor-not-allowed line-through'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Full name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 sm:py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
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
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 sm:py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+359 888 123 456"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 sm:py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a9a] mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 sm:py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
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
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 sm:py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 sm:py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] active:scale-[0.98] transition-all"
            >
              {submitting ? 'Saving...' : 'Request this time'}
            </button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {submitted && (
        <div className="mt-6 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <h4 className="text-lg font-semibold text-white mb-2">Booking request received</h4>
          <p className="text-sm text-[#9a9a9a]">
            Your requested time is {selectedDate} at {selectedTime} ({TIME_ZONE}).
            Our team will confirm the meeting details.
          </p>
          <button
            onClick={() => { if(availabilityError){window.location.reload();return;} setSubmitted(false); setShowForm(false); setSelectedTime(null); setFormData({ name: '', email: '', phone: '', company: '', description: '' }); }}
            className="mt-4 text-sm text-white underline underline-offset-4"
          >
            {availabilityError ? 'Reload availability' : 'Book another call'}
          </button>
        </div>
      )}
    </div>
  );
}
