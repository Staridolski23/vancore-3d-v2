'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function PublicTrustCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then((res) => res.json())
      .then((data) => {
        setCount(Number(data?.users || 0));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <section className='relative py-16'>
      <div className='relative z-10 max-w-7xl mx-auto px-6 text-center'>
        <div className='glass rounded-3xl p-10 border border-white/5'>
          <h2 className='text-3xl md:text-5xl font-black mb-4'>
            <span className='text-vancore-gold'>{loading ? '...' : count ?? 0}</span>
            <span className='text-vancore-muted'> бизнеса се довериха на VANCORE</span>
          </h2>
          <p className='text-sm text-vancore-muted'>Броят се обновява в реално време спрямо новите запитвания в CRM</p>
        </div>
      </div>
    </section>
  );
}
