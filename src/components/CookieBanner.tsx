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
      setVisible(true);
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

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const rejectNonEssential = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  const saveCustom = () => {
    saveConsent({});
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {}} // Prevent closing by clicking outside
      />
      
      {/* Banner */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🍪</span>
              <h3 className="text-lg font-semibold text-white">Cookie Consent</h3>
            </div>
            <p className="text-sm text-[#9a9a9a] leading-relaxed">
              VANCORE uses cookies and similar technologies to enhance your experience, 
              analyze website usage, and provide AI-powered business insights. 
              We respect your privacy and comply with GDPR.
            </p>
          </div>

          {/* Customize Options */}
          {showCustomize && (
            <div className="px-6 pb-4 space-y-3 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Necessary</div>
                  <div className="text-[11px] text-[#6b6b6b]">Required for the website to function</div>
                </div>
                <div className="w-10 h-6 bg-[#991930] rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Analytics</div>
                  <div className="text-[11px] text-[#6b6b6b]">Help us understand site usage</div>
                </div>
                <button
                  onClick={() => setConsent(c => ({ ...c, analytics: !c.analytics }))}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${consent.analytics ? 'bg-[#991930]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.analytics ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Marketing</div>
                  <div className="text-[11px] text-[#6b6b6b]">Personalized business insights</div>
                </div>
                <button
                  onClick={() => setConsent(c => ({ ...c, marketing: !c.marketing }))}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${consent.marketing ? 'bg-[#991930]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.marketing ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="px-6 pb-6 space-y-2">
            <button
              onClick={acceptAll}
              className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-semibold hover:bg-[#a83d1f] transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={rejectNonEssential}
              className="w-full py-2.5 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="w-full py-2 rounded-lg text-[#9a9a9a] text-xs font-medium hover:text-white transition-colors"
            >
              {showCustomize ? 'Hide Options' : 'Customize ⚙️'}
            </button>
            {showCustomize && (
              <button
                onClick={saveCustom}
                className="w-full py-2.5 rounded-lg border border-[#991930]/30 text-[#991930] text-sm font-medium hover:bg-[#991930]/10 transition-colors"
              >
                Save Preferences
              </button>
            )}
          </div>

          {/* Links */}
          <div className="px-6 pb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/5 pt-4">
            <a href="/privacy" className="text-[11px] text-[#9a9a9a] hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span className="text-white/20">|</span>
            <a href="/terms" className="text-[11px] text-[#9a9a9a] hover:text-white transition-colors">
              Terms of Service
            </a>
            <span className="text-white/20">|</span>
            <a href="/cookies" className="text-[11px] text-[#9a9a9a] hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

// Helper function to check if user has given consent
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
