'use client';

import { useRef, useEffect } from 'react';

type Bar = { label: string; value: number; color: string };

const bars: Bar[] = [
  { label: 'HoReCa', value: 4, color: 'bg-amber-400' },
  { label: 'E-commerce', value: 3, color: 'bg-sky-400' },
  { label: 'SME', value: 2, color: 'bg-emerald-400' },
  { label: 'IT', value: 1, color: 'bg-violet-400' },
];

export default function AdminAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Оборот по отрасли</h2>
        <div className="glass rounded-2xl p-5 border border-white/5">
          {bars.map((item) => (
            <div key={item.label} className="flex items-center gap-4 mb-3 last:mb-0">
              <div className="w-24 text-xs text-vancore-muted">{item.label}</div>
              <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.value * 20}%` }}
                />
              </div>
              <div className="w-8 text-right text-xs font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="text-xs text-vancore-muted mb-1">Обобщени запитвания</div>
          <div className="text-2xl font-black text-vancore-gold">14</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="text-xs text-vancore-muted mb-1">AI сесии</div>
          <div className="text-2xl font-black text-vancore-gold">47</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="text-xs text-vancore-muted mb-1">Казуси</div>
          <div className="text-2xl font-black text-vancore-gold">10</div>
        </div>
      </div>
    </div>
  );
}
