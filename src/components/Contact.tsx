'use client';

import { useState } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: formData.name,
          sender_email: formData.email,
          subject: 'Входящо запитване от сайта',
          message: formData.message,
          type: 'contact',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Грешка при изпращане. Моля, опитайте отново.');
      }
    } catch (err) {
      alert('Грешка при изпращане. Моля, опитайте отново.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="контакт" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-vancore-dark/90 via-vancore-navy/60 to-vancore-dark/90" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vancore-bronze/20 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-xs text-vancore-bronze tracking-widest uppercase">Контакт</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Свържете се с <span className="gradient-text">нашия екип</span></h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="glass rounded-3xl p-8 border border-white/5">
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold mb-2">Съобщението е изпратено!</h3>
                <p className="text-vancore-muted">Ще се свържем с вас в рамките на 24 часа.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                <div><label className="block text-sm font-semibold mb-2">Вашето име</label><input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vancore-bronze/40" placeholder="Име Фамилия" /></div>
                <div><label className="block text-sm font-semibold mb-2">Имейл</label><input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vancore-bronze/40" placeholder="your@email.com" /></div>
                <div><label className="block text-sm font-semibold mb-2">Опишете вашия проблем</label><textarea required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vancore-bronze/40 resize-none" placeholder="Опишете накратко проблема..." /></div>
                <button type="submit" disabled={sending} className="w-full px-6 py-4 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold rounded-xl hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? 'Изпращане...' : 'Изпрати запитване'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h4 className="font-bold mb-4">Контактна информация</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><span className="text-xl">📧</span><div><div className="text-xs text-vancore-muted">Имейл</div><div className="text-sm">hello@vancore.ai</div></div></div>
                <div className="flex items-center gap-3"><span className="text-xl">📍</span><div><div className="text-xs text-vancore-muted">Локация</div><div className="text-sm">София, България</div></div></div>
              </div>
            </div>
            <div className="glass rounded-2xl p-6 bg-gradient-to-br from-vancore-bronze/10 to-transparent border-vancore-bronze/20">
              <h4 className="font-bold mb-2">⚡ Директен AI анализ</h4>
              <p className="text-sm text-vancore-muted mb-4">Започнете безплатния AI анализ сега.</p>
              <a href="#анализ" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-bold text-sm rounded-full">Започни сега →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
