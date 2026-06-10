'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

import messagesBg from '../messages/bg.json';
import messagesEn from '../messages/en.json';

type Locale = 'bg' | 'en';

interface LanguageState {
  locale: Locale;
  messages: Record<string, any>;
}

interface LanguageContextValue extends LanguageState {
  toggle: () => void;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const getInitialState = (): LanguageState => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('vancore-locale') : null;
      const locale: Locale = stored === 'en' ? 'en' : 'bg';
      const messages = locale === 'bg' ? messagesBg : messagesEn;
      return { locale, messages };
    } catch {
      return { locale: 'bg', messages: messagesBg };
    }
  };

  const [state, setState] = useState<LanguageState>(getInitialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vancore-locale', state.locale);
    }
  }, [state.locale]);

  const toggle = () => {
    setState((prev) => {
      const next = prev.locale === 'bg' ? 'en' : 'bg';
      return { locale: next, messages: next === 'bg' ? messagesBg : messagesEn };
    });
  };

  const setLocale = (next: Locale) => {
    setState({ locale: next, messages: next === 'bg' ? messagesBg : messagesEn });
  };

  const t = useMemo(() => {
    const walk = (source: Record<string, any>, key: string) => {
      const keys = key.split('.');
      let value: any = source;
      for (const k of keys) value = value?.[k];
      return value;
    };

    return (key: string, params?: Record<string, string | number>) => {
      let value = walk(state.messages, key);
      if (value === undefined) value = walk(messagesBg, key);
      if (typeof value !== 'string') return key;
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    };
  }, [state.messages]);

  return (
    <LanguageContext.Provider value={{ ...state, toggle, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: 'bg',
      messages: messagesBg,
      toggle: () => {},
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        const keys = key.split('.');
        let value: any = messagesBg;
        for (const k of keys) value = value?.[k];
        if (typeof value !== 'string') return key;
        if (!params) return value;
        return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
      },
    };
  }
  return ctx;
}
