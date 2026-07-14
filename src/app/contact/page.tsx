'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or email us directly at hello@vancoresys.com');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <main className="min-h-screen bg-white text-[#111]">

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — CONTACT
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            Let's talk.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            By appointment only. Reach out and we'll schedule a short call to understand your situation and determine if we're the right fit.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-[#111] leading-[1.08] mb-6">
                Start here.
              </h2>
              <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed mb-8 max-w-md">
                Tell us about your company and the problem you're facing. We respond within 24 hours on business days.
              </p>

              <div className="space-y-4 text-sm text-[#111]">
                <div>
                  <div className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#6b6b6b] uppercase mb-1">
                    Email
                  </div>
                  <a href="mailto:hello@vancoresys.com" className="hover:text-[#991930]">
                    hello@vancoresys.com
                  </a>
                </div>
                <div className="h-px bg-[#e5e5e5]" />
                <div>
                  <div className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#6b6b6b] uppercase mb-1">
                    Client Portal
                  </div>
                  <a href="/client-portal" className="inline-flex items-center gap-2 hover:text-[#991930]">
                    Existing clients sign in here <span aria-hidden>→</span>
                  </a>
                </div>
                <div className="h-px bg-[#e5e5e5]" />
                <div>
                  <div className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#6b6b6b] uppercase mb-1">
                    AI Analyst
                  </div>
                  <a href="/ai-analyst" className="inline-flex items-center gap-2 hover:text-[#991930]">
                    Try Vera — our free AI analyst <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="border border-[#e5e5e5] rounded-sm p-6 md:p-8">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-[#10b981] font-display text-2xl mb-3">✓ Message sent!</div>
                  <p className="font-sans text-sm text-[#6b6b6b]">
                    We'll get back to you within 24 hours on business days.
                  </p>
                  <button
                    onClick={() => { setSent(false); setFormData({ name: '', email: '', company: '', message: '' }); }}
                    className="mt-4 text-sm text-[#991930] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-xs text-[#6b6b6b] mb-1">Name *</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => handleChange('name', e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs text-[#6b6b6b] mb-1">Email *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                    <input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={e => handleChange('company', e.target.value)}
                      placeholder="Company name"
                      className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs text-[#6b6b6b] mb-1">What's the problem? *</label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => handleChange('message', e.target.value)}
                      placeholder="Describe the situation you're facing..."
                      className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40 resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-medium btn-hover disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-[#9a9a9a]">© 2026 Vancore Systems. All rights reserved.</div>
            <div className="flex gap-4 text-sm">
              <a href="/privacy" className="text-[#6b6b6b] hover:text-[#991930]">Privacy</a>
              <a href="/terms" className="text-[#6b6b6b] hover:text-[#991930]">Terms</a>
              <a href="/cookies" className="text-[#6b6b6b] hover:text-[#991930]">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
