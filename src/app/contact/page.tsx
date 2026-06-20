'use client';

import Header from '@/components/Header';
import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

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
                  <div className="text-[#991930] font-display text-2xl mb-3">Message sent.</div>
                  <p className="font-sans text-sm text-[#6b6b6b]">
                    We'll get back to you within 24 hours on business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-xs text-[#6b6b6b] mb-1">Name</label>
                    <input id="name" type="text" required placeholder="Your name" className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs text-[#6b6b6b] mb-1">Email</label>
                    <input id="email" type="email" required placeholder="you@company.com" className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40" />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-xs text-[#6b6b6b] mb-1">Company</label>
                    <input id="company" type="text" placeholder="Company name" className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs text-[#6b6b6b] mb-1">What's the problem?</label>
                    <textarea id="message" required rows={4} placeholder="Describe the situation you're facing..." className="w-full bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#991930]/40 resize-none" />
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-medium hover:bg-[#a83d1f] transition-colors">
                    Send message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
