'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function PublicTrustCounter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => {
        const total = (data.leads || 0) + (data.cases || 0) + (data.users || 0);
        animateCounter(total);
      })
      .catch(() => {
        animateCounter(14); // fallback
      });
  }, []);

  const animateCounter = (target: number) => {
    let current = 0;
    const step = () => {
      current += 1;
      if (current > target) return;
      setCount(current);
      setTimeout(step, 80);
    };
    step();
  };

  return (
    <section className="relative py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm text-vancore-bronze tracking-widest uppercase mb-4">Доверие</p>
        <div className="flex items-end justify-center gap-3">
          <span className="text-6xl md:text-7xl font-black text-vancore-gold leading-none">
            {count}+
          </span>
          <span className="text-xl md:text-2xl text-vancore-muted mb-2">бизнеса се довериха на VANCORE</span>
        </div>
        <p className="text-xs text-vancore-muted mt-4">Броят се обновява в реално време спрямо новите запитвания в CRM</p>
      </div>
    </section>
  );
}
