'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/ai-analyst', label: 'AI Analyst' },
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
            <div className="font-display text-base text-[#111] mb-1">Vancore Systems</div>
            <p className="text-sm text-[#6b6b6b] leading-relaxed">
              A boutique business analysis & development consultancy.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
                Navigate
              </div>
              <nav className="space-y-1" aria-label="Footer navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-[#6b6b6b] hover:text-[#c94f2b]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
                Contact
              </div>
              <div className="space-y-1 text-sm text-[#6b6b6b]">
                <div>{email}</div>
                <div>By appointment only.</div>
                <a href="/client-portal" className="inline-flex items-center gap-1 hover:text-[#c94f2b]">
                  Client Portal <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#e5e5e5] text-xs text-[#9a9a9a]">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
