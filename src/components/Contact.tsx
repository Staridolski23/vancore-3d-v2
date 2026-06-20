'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

export default function Contact() {
  const { getSection } = useSiteContent();
  const section = getSection('contact');

  return (
    <section id="contact" className="bg-white py-20 md:py-28 border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — CONTACT
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05]">
              {section?.title || 'Let’s talk'}
            </h2>
            <p className="mt-4 font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-md">
              {section?.subtitle || 'By appointment only — reach out and we’ll schedule a short call.'}
            </p>
          </div>

          <div className="border border-[#e5e5e5] rounded-sm p-6 md:p-8">
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
                  Client Portal <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
