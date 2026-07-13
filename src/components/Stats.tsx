'use client';
import { Calendar, Briefcase, TrendingUp, Users } from 'lucide-react';

const items = [
  { value: '6+', label: 'YEARS EMBEDDED', icon: Calendar },
  { value: '47', label: 'ENGAGEMENTS DELIVERED', icon: Briefcase },
  { value: '92%', label: 'CLIENT RETENTION', icon: TrendingUp },
  { value: '2', label: 'FOUNDERS, HANDS-ON', icon: Users },
];

export default function Stats() {
  return (
    <section className="border-y border-[#e5e5e5] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e5e5]">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="py-6 sm:py-8 md:py-10 lg:py-14 px-2 sm:px-4 md:px-6 text-center">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#991930]" strokeWidth={1.5} />
                </div>
                <div className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#111] mb-1 sm:mb-2">
                  {item.value}
                </div>
                <div className="h-px w-6 sm:w-8 bg-[#991930] mx-auto mb-1 sm:mb-2" />
                <div className="text-[9px] sm:text-[11px] md:text-xs font-sans font-medium text-[#6b6b6b] tracking-[0.1em] sm:tracking-[0.15em] uppercase">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
