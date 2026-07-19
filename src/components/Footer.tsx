'use client';

import { useSiteContent } from '@/hooks/useSiteContent';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/ai-analyst', label: 'AI Analyst' },
  { href: '/blog', label: 'Blog' },
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
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <img src="/images/logo-navy.png" alt="Vancore Systems" className="h-12 w-auto mb-2" />
            <p className="text-xs text-[#6b6b6b] leading-relaxed mb-2">
              A <span className="text-[#991930] font-medium">boutique business</span> analysis & development consultancy.
            </p>
            <div className="flex flex-wrap gap-1" aria-label="Trust badges">
              {['GDPR','EU-hosted','AES-256','JWT+RBAC','TLS 1.2+','Audit'].map(item => (
                <span key={item} className="px-1.5 py-0.5 rounded-full border border-[#d1d1d1] bg-white text-[10px] font-medium text-[#111]">{item}</span>
              ))}
            </div>
            <div className="text-[10px] text-[#6b6b6b] mt-1.5 space-y-0.5">
              <div>Data in EU: Supabase EU + DigitalOcean Frankfurt. AES-256 at rest, TLS 1.2+ in transit. JWT + RBAC with session expiry.</div>
              <div>Automated daily backups. Policy review ongoing; certification roadmap in preparation.</div>
              <div>Processors: Supabase · Vercel · DigitalOcean</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
              Navigate
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <nav className="space-y-0.5" aria-label="Footer navigation">
                {navLinks.slice(0, Math.ceil(navLinks.length / 2)).map((link) => (
                  <a key={link.href} href={link.href} className="block text-xs text-[#4a4a4a] hover:text-[#991930]">{link.label}</a>
                ))}
              </nav>
              <nav className="space-y-0.5" aria-label="Footer navigation">
                {navLinks.slice(Math.ceil(navLinks.length / 2)).map((link) => (
                  <a key={link.href} href={link.href} className="block text-xs text-[#4a4a4a] hover:text-[#991930]">{link.label}</a>
                ))}
              </nav>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#111] mb-2">
              Contact
            </div>
            <div className="space-y-0.5 text-xs text-[#4a4a4a]">
              <div>{email}</div>
              <div>Sofia, Bulgaria</div>
              <div>By appointment only.</div>
              <a href="/client-portal" className="inline-flex items-center gap-1 hover:text-[#991930]">
                Client Portal <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#e5e5e5] text-xs text-[#4a4a4a]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              {copyright}
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-0.5" aria-label="Legal navigation">
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
