'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/ai-analyst', label: 'AI Analyst' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ role?: string; name?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ` + token },
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('vancore_client_token');
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vancore_client_token');
    setUser(null);
    window.location.href = '/';
  };

  const handleDashboard = () => {
    if (user?.role === 'admin') {
      window.location.href = '/admin-v2';
    } else {
      window.location.href = '/client-portal';
    }
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[#991930] focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled ? 'bg-white border-b border-black/5' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center -my-6">
            <img src="/images/logo-black.jpg" alt="Vancore Systems" className="h-28 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-sans text-[#6b6b6b] hover:text-[#111] transition-colors">
                {link.label}
              </a>
            ))}
            <a href="/faq" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-[#6b6b6b] hover:text-[#111] transition-colors">
              FAQ
            </a>
            <a href="/book-call" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-[#6b6b6b] hover:text-[#111] transition-colors">
              Book a call
            </a>
            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={handleDashboard} className="btn-hover inline-flex items-center gap-2 px-4 py-2 bg-[#991930] text-white text-sm font-sans font-medium">
                  {user.role === 'admin' ? '🛡️ Admin' : '📊 Dashboard'}
                </button>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-sans font-medium text-[#6b6b6b] hover:text-[#991930] border border-[#e5e5e5] hover:border-[#991930]/30 transition-colors">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => router.push('/login')} className="btn-hover inline-flex items-center gap-2 px-4 py-2 bg-[#991930] text-white text-sm font-sans font-medium">
                  Sign in
                </button>
                <button onClick={() => router.push('/login?tab=register')} className="btn-hover inline-flex items-center gap-2 px-4 py-2 bg-[#991930] text-white text-sm font-sans font-medium">
                  Register
                </button>
              </div>
            )}
          </nav>

          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" aria-expanded={mobileOpen}>
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

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-black/5 shadow-lg">
            <nav className="flex flex-col py-4 px-4" aria-label="Mobile navigation">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="py-3 text-base font-sans text-[#111] hover:text-[#991930] transition-colors border-b border-black/5 last:border-0">
                  {link.label}
                </a>
              ))}
              <a href="/faq" className="py-3 text-base font-sans text-[#111] hover:text-[#991930] transition-colors border-b border-black/5">
                FAQ
              </a>
              <a href="/book-call" className="py-3 text-base font-sans text-[#111] hover:text-[#991930] transition-colors border-b border-black/5">
                Book a call
              </a>
              {user ? (
                <>
                  <button onClick={handleDashboard} className="mt-3 w-full py-3 bg-[#991930] text-white text-base font-sans font-medium rounded-lg">
                    {user.role === 'admin' ? '🛡️ Admin Panel' : '📊 Dashboard'}
                  </button>
                  <button onClick={handleLogout} className="mt-2 w-full py-3 text-base font-sans font-medium text-[#6b6b6b] border border-[#e5e5e5] rounded-lg">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => router.push('/login')} className="mt-3 w-full py-3 bg-[#991930] text-white text-base font-sans font-medium rounded-lg">
                    Sign in
                  </button>
                  <button onClick={() => router.push('/login?tab=register')} className="mt-2 w-full py-3 bg-[#991930] text-white text-base font-sans font-medium rounded-lg">
                    Register
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
