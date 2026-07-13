'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/ai-analyst', label: 'AI Analyst' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const { getFooter } = useSiteContent();
  const footer = getFooter();
  const copyright = footer.text || '© 2026 Vancore Systems. All rights reserved.';
  const email = footer.contactEmail || 'hello@vancoresys.com';

  return (
    <footer className="bg-[#f7f6f2] border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="md:max-w-xs">
            <div className="font-display text-lg text-[#111] mb-1">Vancore Systems</div>
            <p className="text-base text-[#6b6b6b] leading-relaxed">
              A <span className="text-[#991930] font-medium">boutique business</span> analysis & development consultancy.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-xs font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
                Navigate
              </div>
              <nav className="space-y-1" aria-label="Footer navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-base text-[#6b6b6b] hover:text-[#991930]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <div className="text-xs font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
                Contact
              </div>
              <div className="space-y-1 text-base text-[#6b6b6b]">
                <div>{email}</div>
                <div>By appointment only.</div>
                <a href="/client-portal" className="inline-flex items-center gap-1 hover:text-[#991930]">
                  Client Portal <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#e5e5e5] text-sm text-[#9a9a9a]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              {copyright}
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Legal navigation">
              <a href="/privacy" className="hover:text-[#991930]">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#991930]">Terms of Service</a>
              <a href="/cookies" className="hover:text-[#991930]">Cookie Policy</a>
              <a href="/legal/compliance" className="hover:text-[#991930]">Legal & Compliance</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
