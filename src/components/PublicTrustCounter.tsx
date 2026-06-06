'use client';

import { useEffect, useRef } from 'react';

export default function PublicTrustCounter() {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = countRef.current;
    if (!el) return;
    const target = 14;
    let current = 0;
    const step = () => {
      current += 1;
      if (current > target) return;
      el.textContent = `${current}+`;
      setTimeout(step, 80);
    };
    step();
  }, []);

  return (
    <section className="relative py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm text-vancore-bronze tracking-widest uppercase mb-4">Доверие</p>
        <div className="flex items-end justify-center gap-3">
          <span ref={countRef} className="text-6xl md:text-7xl font-black text-vancore-gold leading-none">
            0+
          </span>
          <span className="text-xl md:text-2xl text-vancore-muted mb-2">бизнеса се довериха на VANCORE</span>
        </div>
        <p className="text-xs text-vancore-muted mt-4">Броят се обновява в реално време спрямо новите запитвания в CRM</p>
      </div>
    </section>
  );
}
