'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

type Message = { id: string; from: 'user' | 'bot'; text: string; time: string };

export default function PublicTrustCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const { messages } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/trust-counter`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setCount(data.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) {
          setCount(7);
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vancore-bronze/5 to-transparent" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="text-xs text-vancore-bronze tracking-widest uppercase">{messages.trustCounter?.suffix || ''}</span>
        </div>
        <div className="text-5xl md:text-7xl font-black gradient-text mb-4">
          {count ?? '—'}
        </div>
        <p className="text-vancore-muted text-sm md:text-base max-w-2xl mx-auto">
          {messages.trustCounter?.subtitle || ''}
        </p>
      </div>
    </section>
  );
}
