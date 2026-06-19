'use client';

import { useState } from 'react';

const questions = [
  'What is the actual decision that keeps getting delayed?',
  'Who is closest to the problem, and what do they already know?',
  'Where does work get reinterpreted between teams?',
  'What would good look like in 60 days?',
];

export default function AIAnalystPage() {
  const [messages, setMessages] = useState<{ from: 'user' | 'ai'; text: string }[]>([
    { from: 'ai', text: 'Hello — I’m Vera. May I ask a few quick questions to understand what’s happening inside your company?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setSending(true);
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { from: 'user', text }] }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: 'ai', text: data?.reply || 'Thanks. Could you tell me a bit more?' }]);
    } catch {
      setMessages((m) => [...m, { from: 'ai', text: 'Sorry — Vera is unavailable right now.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white border-t border-[#e5e5e5]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-[#c94f2b] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">— AI ANALYST</div>
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-6">Chat with Vera.</h1>
        <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed mb-8">
          Describe your case. Vera will ask a few sharp questions and prepare a brief for our team.
        </p>

        <div className="border border-[#e5e5e5] rounded-sm">
          <div className="bg-[#f7f6f2] px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
            <div className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#6b6b6b] uppercase">Live chat</div>
            <div className="text-[10px] font-sans text-[#6b6b6b]">Vera</div>
          </div>
          <div className="p-5 space-y-4 h-[360px] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full shrink-0 ${m.from === 'user' ? 'bg-[#111]' : 'bg-[#e5e5e5]'}`} />
                <div className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] ${m.from === 'user' ? 'bg-[#111] text-white rounded-tr-sm' : 'bg-[#f7f6f2] border border-[#e5e5e5] text-[#111] rounded-tl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e5e5e5] shrink-0" />
                <div className="rounded-2xl rounded-tl-sm bg-[#f7f6f2] border border-[#e5e5e5] px-4 py-3 text-sm text-[#111]">…</div>
              </div>
            )}
          </div>
          <div className="border-t border-[#e5e5e5] p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Describe your case…"
              className="flex-1 bg-white border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#c94f2b]/40"
            />
            <button
              onClick={send}
              disabled={sending}
              className="px-4 py-2.5 rounded-lg bg-[#c94f2b] text-white text-sm font-medium hover:bg-[#a83d1f] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
