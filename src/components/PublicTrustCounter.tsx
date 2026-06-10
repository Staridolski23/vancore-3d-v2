'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

export default function PublicTrustCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useLanguage();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

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
            <span className='text-vancore-muted'> {t('trustCounter.suffix')}</span>
          </h2>
          <p className='text-sm text-vancore-muted'>{t('trustCounter.subtitle')}</p>
        </div>
      </div>
    </section>
  );
}
