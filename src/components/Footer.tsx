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
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-display text-lg text-[#111] mb-2">Vancore Systems</div>
            <p className="text-sm text-[#6b6b6b] leading-relaxed max-w-xs">
              A boutique business analysis & development consultancy.
            </p>
          </div>

          <div>
            <div className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-[#111] mb-3">
              Navigate
            </div>
            <nav className="space-y-1.5" aria-label="Footer navigation">
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
            <div className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-[#111] mb-3">
              Contact
            </div>
            <div className="space-y-1.5 text-sm text-[#6b6b6b]">
              <div>{email}</div>
              <div>By appointment only.</div>
              <a href="/client-portal" className="inline-flex items-center gap-2 hover:text-[#c94f2b]">
                Client Portal <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[#e5e5e5] text-sm text-[#6b6b6b]">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
