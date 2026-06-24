'use client';

import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/ai-analyst', label: 'AI Analyst' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled ? 'bg-white border-b border-black/5' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#111] text-white flex items-center justify-center font-display text-lg font-bold">
            V
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-semibold text-[#111] tracking-wide">Vancore</div>
            <div className="text-[9px] font-sans font-semibold text-[#6b6b6b] tracking-[0.22em] uppercase">Systems</div>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-sans text-[#6b6b6b] hover:text-[#111] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/client-portal"
            className="text-sm font-sans text-[#6b6b6b] hover:text-[#111] transition-colors"
          >
            Sign in
          </a>
          <a
            href="/contact"
            className="btn-hover inline-flex items-center gap-2 px-4 py-2 bg-[#991930] text-white text-sm font-sans font-medium"
          >
            Book a call
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rotate-[-45deg]"
            >
              <path d="M7 7h10v10" />
              <path d="M7 17 17 7" />
            </svg>
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111]">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111]">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-black/5 shadow-lg">
          <nav className="flex flex-col py-4 px-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-3 text-base font-sans text-[#111] hover:text-[#991930] transition-colors border-b border-black/5 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/client-portal"
              className="py-3 text-base font-sans text-[#111] hover:text-[#991930] transition-colors border-b border-black/5"
            >
              Sign in
            </a>
            <a
              href="/contact"
              className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#991930] text-white text-base font-sans font-medium rounded-lg"
            >
              Book a call
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
