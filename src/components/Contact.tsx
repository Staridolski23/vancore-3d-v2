'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

type Incoming = { id: string; sender_email: string; subject: string; message: string; created_at: string };

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { messages } = useLanguage();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus(t('contact.form.success'));
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('Грешка при изпращане. Опитайте отново.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id='контакт' className='relative py-32'>
      <div className='relative z-10 max-w-7xl mx-auto px-6'>
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6'>
            <span className='text-xs text-vancore-bronze tracking-widest uppercase'>{t('contact.title')}</span>
          </div>
          <h2 className='text-3xl md:text-5xl font-black mb-4'>{t('contact.title')}</h2>
        </div>
        <div className='grid md:grid-cols-2 gap-10'>
          <form onSubmit={submit} className='glass rounded-3xl p-8 border border-white/5 space-y-5'>
            <div>
              <label className='block text-xs text-vancore-muted mb-2'>{t('contact.form.name')}</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40' />
            </div>
            <div>
              <label className='block text-xs text-vancore-muted mb-2'>{t('contact.form.email')}</label>
              <input required type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40' />
            </div>
            <div>
              <label className='block text-xs text-vancore-muted mb-2'>{t('contact.form.message')}</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40 min-h-[120px]' />
            </div>
            <button type='submit' disabled={loading} className='w-full py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold disabled:opacity-50'>{t('contact.form.submit')}</button>
            {status && <p className='text-xs text-vancore-muted'>{status}</p>}
          </form>
          <div className='glass rounded-3xl p-8 border border-white/5 space-y-4 text-sm text-vancore-muted'>
            <h3 className='text-lg font-bold text-vancore-light'>Контактна информация</h3>
            <p>{t('contact.info.email')}</p>
            <p>{t('contact.info.phone')}</p>
            <div>
              <h4 className='font-semibold text-vancore-light'>⚡ Директен AI анализ</h4>
              <p>{t('contact.info.directAnalysisDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
