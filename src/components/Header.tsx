'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const navLinks = [
  { href: '#проблеми', labelKey: 'nav.problems' },
  { href: '#методология', labelKey: 'nav.methodology' },
  { href: '#анализ', labelKey: 'nav.analysis' },
  { href: '#услуги', labelKey: 'nav.services' },
  { href: '#екип', labelKey: 'nav.team' },
  { href: '#контакт', labelKey: 'nav.contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, toggle, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass py-3' : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center font-bold text-vancore-dark text-lg group-hover:scale-110 transition-transform">V</div>
          <span className="text-xl font-bold tracking-wider">VAN<span className="gradient-text">CORE</span></span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-vancore-muted hover:text-vancore-bronze transition-colors duration-300 tracking-wide uppercase">
              {t(link.labelKey)}
            </a>
          ))}
          <button
            onClick={toggle}
            className="px-3 py-1.5 text-xs font-semibold border border-white/10 rounded-full text-vancore-muted hover:text-vancore-bronze transition-colors"
            aria-label="Toggle language"
          >
            {locale === 'bg' ? 'EN' : 'BG'}
          </button>
          <a
            href="/client-portal"
            className="px-5 py-2.5 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all duration-300"
          >
            {t('nav.clientPortal')}
          </a>
          <a
            href="#анализ"
            className="px-5 py-2.5 border border-vancore-bronze/30 text-vancore-bronze font-semibold text-sm rounded-full hover:bg-vancore-bronze/10 transition-all duration-300"
          >
            {t('nav.freeAnalysis')}
          </a>
        </nav>

        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <span className={`w-6 h-0.5 bg-vancore-bronze transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-vancore-bronze transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-vancore-bronze transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass mt-2 mx-4 rounded-2xl p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-vancore-muted hover:text-vancore-bronze py-2" onClick={() => setMobileOpen(false)}>
              {t(link.labelKey)}
            </a>
          ))}
          <button
            onClick={() => { toggle(); setMobileOpen(false); }}
            className="px-5 py-3 border border-vancore-bronze/30 text-vancore-bronze font-semibold text-center rounded-full"
          >
            {locale === 'bg' ? 'EN' : 'BG'}
          </button>
          <a
            href="/client-portal"
            className="px-5 py-3 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold text-center rounded-full"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.clientPortal')}
          </a>
          <a
            href="#анализ"
            className="px-5 py-3 border border-vancore-bronze/30 text-vancore-bronze font-semibold text-center rounded-full"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.freeAnalysis')}
          </a>
        </div>
      )}
    </header>
  );
}
