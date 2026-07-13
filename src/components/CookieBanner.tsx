'use client';

import { useState, useEffect } from 'react';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const CONSENT_KEY = 'vancore_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        setConsent(JSON.parse(saved));
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const saveConsent = (newConsent: Partial<ConsentState>) => {
    const updated: ConsentState = {
      ...consent,
      ...newConsent,
      timestamp: new Date().toISOString(),
    };
    setConsent(updated);
    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated));
    setVisible(false);
    setShowCustomize(false);
  };

  const acceptAll = () => saveConsent({ analytics: true, marketing: true });
  const rejectNonEssential = () => saveConsent({ analytics: false, marketing: false });
  const saveCustom = () => saveConsent({});

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 sm:bg-black/50" />
      
      {/* Mobile: Bottom Sheet, Desktop: Center Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md bg-[#0a0a0a] sm:rounded-2xl sm:border border-white/10 border-t border-white/10 rounded-t-2xl shadow-2xl overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🍪</span>
              <h3 className="text-sm font-semibold text-white">Cookie Consent</h3>
            </div>
            <p className="text-xs text-[#9a9a9a] leading-relaxed leading-relaxed">
              We use cookies to enhance your experience and provide AI-powered business insights. 
              We respect your privacy and comply with GDPR.
            </p>
          </div>

          {showCustomize && (
            <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-3 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white">Necessary</div>
                <div className="w-9 h-5 bg-[#991930] rounded-full flex items-center justify-end px-0.5">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white">Analytics</div>
                <button
                  onClick={() => setConsent(c => ({ ...c, analytics: !c.analytics }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${consent.analytics ? 'bg-[#991930]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.analytics ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white">Marketing</div>
                <button
                  onClick={() => setConsent(c => ({ ...c, marketing: !c.marketing }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${consent.marketing ? 'bg-[#991930]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.marketing ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 space-y-1.5">
            <button
              onClick={acceptAll}
              className="w-full py-2.5 rounded-lg bg-white text-[#111] text-sm font-semibold border border-white/20 hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Accept All
            </button>
            <button
              onClick={rejectNonEssential}
              className="w-full py-2.5 rounded-lg bg-transparent text-white text-sm font-semibold border border-white/20 hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="w-full py-2 rounded-lg text-[#9a9a9a] text-xs font-medium hover:text-white transition-colors"
            >
              {showCustomize ? 'Hide' : 'Customize ⚙️'}
            </button>
            {showCustomize && (
              <button
                onClick={saveCustom}
                className="w-full py-2 rounded-lg border border-[#991930]/30 text-[#991930] text-xs font-medium hover:bg-[#991930]/10 transition-colors"
              >
                Save
              </button>
            )}
          </div>

          <div className="px-4 pb-3 flex items-center justify-center gap-3 border-t border-white/5 pt-2 sm:px-5 sm:pb-4">
            <a href="/privacy" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Privacy</a>
            <span className="text-white/20">|</span>
            <a href="/terms" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Terms</a>
            <span className="text-white/20">|</span>
            <a href="/cookies" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </>
  );
}

export function hasConsent(type: 'analytics' | 'marketing'): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(CONSENT_KEY);
  if (!saved) return false;
  try {
    const consent = JSON.parse(saved);
    return consent[type] === true;
  } catch {
    return false;
  }
}
