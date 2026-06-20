'use client';

import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

type Message = { id: string; from: 'user' | 'bot'; text: string; time: string; createdAt?: string };

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMessage: Message = { id: `u-${Date.now()}`, from: 'user', text, time: new Date().toLocaleTimeString('bg-BG') };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      const botMessage: Message = {
        id: `b-${Date.now()}`,
        from: 'bot',
        text: data.reply || t('chatBot.fallback'),
        time: new Date().toLocaleTimeString('bg-BG'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (err) {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, from: 'bot', text: t('chatBot.error'), time: new Date().toLocaleTimeString('bg-BG') }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={toggleChat} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#991930] to-[#991930] text-vancore-dark shadow-lg flex items-center justify-center text-2xl">
        {isOpen ? '✕' : '💬'}
      </button>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-md">
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-sm">{t('chatBot.title')}</h3>
                <p className="text-xs text-vancore-muted">{t('chatBot.subtitle')}</p>
              </div>
              <button onClick={toggleChat} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-vancore-muted hover:text-vancore-light">✕</button>
            </div>
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.from === 'user' ? 'bg-vancore-bronze/20 text-vancore-light rounded-tr-sm' : 'bg-white/5 text-vancore-muted rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-line">{m.text}</p>
                    <p className="text-[10px] text-vancore-muted mt-1 text-right">{m.time}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex">
                  <div className="bg-white/5 text-vancore-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm">{t('chatBot.thinking')}</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={t('chatBot.placeholder')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40"
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()} className="px-4 py-2.5 bg-gradient-to-r from-[#991930] to-[#991930] text-vancore-dark rounded-xl text-sm font-semibold disabled:opacity-50">{t('chatBot.send')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
