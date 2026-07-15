'use client';

import { useInView } from '@/hooks/useInView';
import { useState, useEffect } from 'react';

export default function Testimonials() {
  const { ref, isInView } = useInView(0.1);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reviews?status=published')
      .then(r => r.ok ? r.json() : Promise.resolve({ reviews: [] }))
      .then(data => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  const fallback = [
    { name: 'Momchil Staridolski', role: 'CEO, MS Auto Solutions', text: 'VANCORE turned our scattered operations into a clear, actionable system. The AI analyst alone saved us hours every week.' },
    { name: 'Mihail Petrov', role: 'Operations Director, Nordic Logistics', text: 'We finally have one source of truth for bookings, clients, and reporting. The platform paid for itself in the first month.' },
  ];

  const items = reviews.length > 0 ? reviews.map((r: any) => ({ name: r.user_id || 'Client', role: r.rating ? r.rating + ' / 5' : 'Verified client', text: r.body })) : fallback;

  return (
    <section ref={ref} className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} bg-white py-20`}>
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-12">Trusted by business operators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-[#444]">“{item.text}”</p>
              <div className="mt-5">
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-xs text-[#6b6b6b]">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
