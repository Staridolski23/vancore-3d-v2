'use client';

import { useState, useEffect, useRef } from 'react';
import { CONSENT_KEY, CONSENT_CHANGED, CONSENT_OPEN, CookieConsent, emptyConsent, storedConsent } from '@/lib/cookie-consent';

function ConsentToggle({label,checked,onChange}:{label:string;checked:boolean;onChange:()=>void}){
  return <button role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center bg-transparent">
    <span aria-hidden className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${checked?'bg-[#991930]':'bg-white/10'}`}>
      <span className={`w-4 h-4 bg-white rounded-full transition-transform ${checked?'translate-x-4':''}`} />
    </span>
  </button>;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>(emptyConsent);
  const [saveError,setSaveError]=useState('');
  const dialogRef=useRef<HTMLDivElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);

  useEffect(() => {
    const saved = storedConsent();
    const open=()=>{setConsent(storedConsent()||emptyConsent());setShowCustomize(true);setVisible(true);};
    window.addEventListener(CONSENT_OPEN,open);
    let timer:ReturnType<typeof setTimeout>|undefined;
    if (!saved) {
      timer = setTimeout(() => setVisible(true), 500);
    } else {
      setConsent(saved);
    }
    return()=>{if(timer)clearTimeout(timer);window.removeEventListener(CONSENT_OPEN,open);};
  }, []);

  useEffect(()=>{
    if(!visible)return;
    previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-consent-reject]')?.focus();
    return()=>{previousFocus.current?.focus();};
  },[visible]);

  const saveConsent = (newConsent: Partial<CookieConsent>) => {
    const updated: CookieConsent = {
      ...consent,
      ...newConsent,
      timestamp: new Date().toISOString(),
    };
    try{localStorage.setItem(CONSENT_KEY, JSON.stringify(updated));}catch{setSaveError('Your choices could not be saved in this browser. Please try again.');return;}
    setSaveError('');
    setConsent(updated);
    window.dispatchEvent(new Event(CONSENT_CHANGED));
    setVisible(false);
    setShowCustomize(false);
  };

  const acceptAll = () => saveConsent({ analytics: true, marketing: true, support: true });
  const rejectNonEssential = () => saveConsent({ analytics: false, marketing: false, support: false });
  const saveCustom = () => saveConsent({});

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 sm:bg-black/50" />
      
      {/* Mobile: Bottom Sheet, Desktop: Center Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title" onKeyDown={event=>{
          if(event.key!=='Tab')return;
          const elements=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')||[]);
          const first=elements[0],last=elements[elements.length-1];
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        }} className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-[#0a0a0a] sm:rounded-2xl sm:border border-white/10 border-t border-white/10 rounded-t-2xl shadow-2xl">
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🍪</span>
              <h3 id="cookie-consent-title" className="text-sm font-semibold text-white">Cookie Consent</h3>
            </div>
            <p className="text-xs text-[#9a9a9a] leading-relaxed leading-relaxed">
              Choose optional services. Support chat uses tawk.to and connects to that provider only when you allow it. You can change your choices in Cookie settings.
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
                <ConsentToggle label="Analytics cookies" checked={consent.analytics} onChange={()=>setConsent(c=>({...c,analytics:!c.analytics}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white">Marketing</div>
                <ConsentToggle label="Marketing cookies" checked={consent.marketing} onChange={()=>setConsent(c=>({...c,marketing:!c.marketing}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white">Support chat (tawk.to)</div>
                <ConsentToggle label="Support chat (tawk.to)" checked={consent.support} onChange={()=>setConsent(c=>({...c,support:!c.support}))} />
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 space-y-1.5">
            {saveError&&<p role="alert" className="text-sm text-red-300">{saveError}</p>}
            <button
              onClick={acceptAll}
              className="w-full py-2.5 rounded-lg bg-white text-[#111] text-sm font-semibold border border-white/20 hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Accept All
            </button>
            <button
              onClick={rejectNonEssential}
              data-consent-reject
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
                className="w-full py-2 rounded-lg border border-white/20 bg-[#991930] text-white text-xs font-medium hover:bg-[#a83d1f] transition-colors"
              >
                Save
              </button>
            )}
          </div>

          <div className="px-4 pb-3 flex items-center justify-center gap-3 border-t border-white/5 pt-2 sm:px-5 sm:pb-4">
            <a href="/privacy" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Terms</a>
            <a href="/cookies" className="text-[10px] text-[#9a9a9a] hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </>
  );
}

export function hasConsent(type: 'analytics' | 'marketing' | 'support'): boolean {
  if (typeof window === 'undefined') return false;
  return storedConsent()?.[type]===true;
}
