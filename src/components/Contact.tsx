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

            <div className="mt-6 p-5 bg-[#111] text-white rounded-lg border border-white/5">
              <p className="text-sm font-semibold mb-2">Your business, instrumented.</p>
              <p className="text-xs text-[#9a9a9a] leading-relaxed">
                Vancore Systems builds operational clarity for business operators: structured bookings, document workflows, and AI-assisted insights — in one platform.
              </p>
              <p className="text-xs text-[#9a9a9a] leading-relaxed mt-2">
                We work with SME and mid-market teams in <strong className="text-white">HoReCa, consulting, logistics, and e-commerce</strong> who want to replace scattered tools with a single source of truth.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-[#9a9a9a]">
                <li>• Booking &amp; client pipeline, fully managed</li>
                <li>• Document automation with audit trail</li>
                <li>• AI analyst for operational decision-making</li>
                <li>• Client portal with role-based access</li>
              </ul>
              <p className="mt-3 text-[10px] text-[#6b6b6b]">No long-term lock-in. No opaque credits. You own your data.</p>
            </div>
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
                  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-white placeholder:text-[#6b6b6b]"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="Email"
                  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-white placeholder:text-[#6b6b6b]"
                />
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                  placeholder="Subject"
                  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-white placeholder:text-[#6b6b6b]"
                />
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Message"
                  rows={4}
                  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-white placeholder:text-[#6b6b6b]"
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
