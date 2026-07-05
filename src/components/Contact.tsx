'use client';

import { useSiteContent } from '@/hooks/useSiteContent';
import { useState } from 'react';

export default function Contact() {
  const { getSection } = useSiteContent();
  const section = getSection('contact');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch {}
  };

  return (
    <section id="contact" className="bg-white py-20 md:py-28 border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — CONTACT
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05]">
              {section?.title || "Let's talk"}
            </h2>
            <p className="mt-4 font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-md">
              {section?.subtitle || 'By appointment only — reach out and we’ll schedule a short call.'}
            </p>
          </div>

          <div className="border border-[#e5e5e5] rounded-sm p-6 md:p-8">
            {submitted ? (
              <div className="text-sm text-[#991930]">Thank you. We'll get back to you shortly.</div>
            ) : (
              <form onSubmit={submit} className="space-y-3 text-sm">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Name"
                  className="w-full border border-[#e5e5e5] rounded-sm px-3 py-2"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="Email"
                  className="w-full border border-[#e5e5e5] rounded-sm px-3 py-2"
                />
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                  placeholder="Subject"
                  className="w-full border border-[#e5e5e5] rounded-sm px-3 py-2"
                />
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Message"
                  rows={4}
                  className="w-full border border-[#e5e5e5] rounded-sm px-3 py-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#991930] text-white rounded-sm text-sm hover:bg-[#a83d1f] transition-colors"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
