'use client';

import { createContext, useContext, useState } from 'react';
import bgMessages from '../messages/bg.json' with { type: 'json' };
import enMessages from '../messages/en.json' with { type: 'json' };

type Locale = 'bg' | 'en';

type Messages = Record<string, any>;

type LanguageContextValue = {
  locale: Locale;
  messages: Messages;
  toggle: () => void;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const MESSAGES: Record<Locale, Messages> = {
  bg: bgMessages,
  en: enMessages,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('bg');
  const [messages, setMessages] = useState<Messages>(MESSAGES[locale]);

  const toggle = () =>
    setLocaleState((prev) => {
      const next = prev === 'bg' ? 'en' : 'bg';
      setMessages(MESSAGES[next]);
      return next;
    });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    setMessages(MESSAGES[next]);
  };

  return (
    <LanguageContext.Provider value={{ locale, messages, toggle, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: 'bg' as Locale,
      messages: {} as Messages,
      toggle: () => {},
      setLocale: () => {},
    };
  }
  return ctx;
}
