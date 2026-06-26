'use client';

import Header from '@/components/Header';
import BookingCalendar from '@/components/BookingCalendar';

export default function BookCallPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Header />
      <div className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <BookingCalendar />
        </div>
      </div>
    </main>
  );
}
