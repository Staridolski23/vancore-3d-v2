'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'bg' | 'en';

type Messages = Record<string, any>;

type LanguageContextValue = {
  locale: Locale;
  messages: Messages;
  toggle: () => void;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('bg');
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const mod = await import(`../messages/${locale}.json`);
      if (!cancelled) setMessages(mod.default || mod);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const toggle = () =>
    setLocaleState((prev) => (prev === 'bg' ? 'en' : 'bg'));

  const setLocale = (next: Locale) => setLocaleState(next);

  return (
    <LanguageContext.Provider value={{ locale, messages, toggle, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
