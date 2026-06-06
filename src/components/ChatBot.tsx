'use client';

import { useState, useEffect, useRef } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type Message = {
  from: 'user' | 'ai';
  text: string;
  time: string;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'ai', text: 'Здравейте! Аз съм AI бизнес анализатор на VANCORE. Какво е вашият бизнес и какви проблеми имате?', time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem('vancore_chat_session');
    if (saved) setSessionId(saved);
  }, []);

  useEffect(() => {
    if (sessionId) localStorage.setItem('vancore_chat_session', sessionId);
  }, [sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMsg: Message = { from: 'user', text: input.trim(), time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: userMsg.text, messages_count: messages.length + 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.id);
      }

      // Also save as incoming message
      await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: 'AI Chat User',
          sender_email: 'chat@vancore.ai',
          subject: `AI Chat: ${userMsg.text.slice(0, 50)}`,
          message: userMsg.text,
          type: 'ai_chat',
        }),
      });

      const aiResponse = await getAIResponse(userMsg.text);
      setMessages(prev => [...prev, { from: 'ai', text: aiResponse, time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'ai', text: 'Извинете, има техническо нарушение. Моля, опитайте отново.', time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setSending(false);
    }
  };

  const getAIResponse = async (userText: string): Promise<string> => {
    const lower = userText.toLowerCase();
    if (lower.includes('хо') || lower.includes('hore') || lower.includes('рестор') || lower.includes('restaurant')) {
      return 'Primary issue detected: HoReCa операционни загуби.\n\n• Основна причина: липса на structured onboarding + high staff turnover\n• Финансово въздействие: ~8,000 EUR/year\n\nПрепоръка: въвеждане на Shift management системи и мотивационна схема.';
    }
    if (lower.includes('it') || lower.includes('софтуер') || lower.includes('software') || lower.includes('код')) {
      return 'IT анализ:\n\n• Основна swimmers: липса на automated testing + technical debt\n• Рискове: 15-20% загуба на development capacity\n\nПрепоръка: въвеждане на CI/CD pipeline + code review process.';
    }
    if (lower.includes('е-ком') || lower.includes('ecom') || lower.includes('магаз') || lower.includes('shop')) {
      return 'E-commerce анализ:\n\n• Primary bottleneck: order fulfillment errors ~15%\n• Impact: 2,400 EUR/month lost revenue\n\nПрепоръка: implement WMS (Warehouse Management System) + automated notifications.';
    }
    if (lower.includes('сме') || lower.includes('sme') || lower.includes('малк') || lower.includes('small')) {
      return 'SME бизнес анализ:\n\n• Most common issues: cash flow management + customer retention\n• Typicalloss: 3,000-5,000 EUR/month\n\nПрепоръка: implement CRM + automated invoicing + loyalty program.';
    }
    return 'Благодаря за въпроса! За пълен анализ, моля предоставете:\n1. Отрасъл\n2. Основен проблем\n3. Оценка на загуби\n\nЩе ви дам детайлен анализ с конкретни стъпки.';
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold text-vancore-dark flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-vancore-bronze/30 transition-all">
        <span className="text-2xl">💬</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md">
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-sm">VANCORE AI анализатор</h3>
                <p className="text-xs text-vancore-muted">Отговори за ~1 минута</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-vancore-muted hover:text-vancore-light transition-colors">✕</button>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.from === 'user' ? 'bg-vancore-bronze/20 text-vancore-light rounded-tr-sm' : 'bg-white/5 text-vancore-muted rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className="text-[10px] text-vancore-muted mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
              {sending && <div className="flex"><div className="bg-white/5 text-vancore-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm">Мисля...</div></div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Опишете вашия бизнес проблем..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40"
                />
                <button onClick={sendMessage} disabled={sending} className="px-4 py-2.5 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark rounded-xl text-sm font-semibold disabled:opacity-50">
                  Изпрати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
