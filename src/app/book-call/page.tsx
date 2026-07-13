'use client';

import Header from '@/components/Header';
import BookingCalendar from '@/components/BookingCalendar';

export default function BookCallPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Header />
      <div className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto mb-16">
            <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — BOOK A CALL
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-white leading-[1.05] mb-6">
              Let’s talk through your next step.
            </h1>
            <p className="font-sans text-sm text-gray-400 leading-relaxed mb-8">
              Pick a time that works for you. We’ll send a calendar invite and a short prep note so you get the most out of the conversation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-sm border border-white/10 p-5">
                <div className="text-white font-display text-xl mb-1">45 min</div>
                <div className="text-xs text-gray-400 tracking-wide uppercase">Duration</div>
              </div>
              <div className="rounded-sm border border-white/10 p-5">
                <div className="text-white font-display text-xl mb-1">Video</div>
                <div className="text-xs text-gray-400 tracking-wide uppercase">Format</div>
              </div>
              <div className="rounded-sm border border-white/10 p-5">
                <div className="text-white font-display text-xl mb-1">1–2 days</div>
                <div className="text-xs text-gray-400 tracking-wide uppercase">Prep turnaround</div>
              </div>
            </div>

            <div className="mt-10 rounded-sm border border-white/10 p-6">
              <h2 className="font-display text-lg text-white mb-3">How to prepare</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Share any existing metrics, reports, or team structures you can.</li>
                <li>• Note the specific decision you’re trying to make.</li>
                <li>• No need for slides or polish — clarity beats presentation.</li>
              </ul>
            </div>
          </div>
          <BookingCalendar />
        </div>
      </div>
    </main>
  );
}
