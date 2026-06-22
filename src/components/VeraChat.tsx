'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import VeraAvatar from '@/components/VeraAvatar';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

const fadeStyle = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
`;

export default function VeraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState(1);
  const [quickReplies, setQuickReplies] = useState<string[] | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [isLeadCapture, setIsLeadCapture] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', company: '', email: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, quickReplies, isLeadCapture, scrollToBottom]);

  // Send initial message on mount
  useEffect(() => {
    sendMessage('Hello');
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setQuickReplies(null); // Clear quick replies after clicking

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      // Artificial delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const assistantMsg: Message = { role: 'assistant', text: data.reply, ts: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      setSessionId(data.sessionId || '');
      setStep(data.step || 1);
      setQuickReplies(data.quickReplies || null);
      setPlaceholder(data.placeholder || '');
      setIsLeadCapture(data.isLeadCapture || false);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
      const errMsg: Message = {
        role: 'assistant',
        text: 'Sorry — Vera is unavailable right now. Please try again or contact hello@vancoresys.com.',
        ts: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitLead = async () => {
    if (!leadData.name || !leadData.email) return;
    try {
      await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Lead submitted', sessionId, leadData }),
      });
      setLeadSubmitted(true);
    } catch {
      setLeadSubmitted(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      <style jsx>{fadeStyle}</style>
      <div className="w-full h-[500px] flex flex-col bg-[#0a0a0a] rounded-sm border border-white/5">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
          <VeraAvatar className="w-8 h-8" />
          <div>
            <div className="text-sm font-semibold text-white">Vera AI</div>
            <div className="text-[10px] text-[#6b6b6b]">Business Analyst • VANCORE</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'assistant' && <VeraAvatar className="w-6 h-6 shrink-0 mt-1" />}
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm">
                <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-white'}`}>
                  {msg.text}
                </p>
                <p className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-white/50' : 'text-[#6b6b6b]'}`}>
                  {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in-up">
              <VeraAvatar className="w-6 h-6 shrink-0 mt-1" />
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#991930] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#991930] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#991930] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Lead Capture Form */}
          {isLeadCapture && !leadSubmitted && (
            <div className="bg-[#1a1a1a] border border-[#991930]/30 rounded-sm p-4 space-y-3 animate-fade-in-up">
              <h4 className="text-sm font-semibold text-white">Get Your Free Assessment</h4>
              <p className="text-xs text-[#9a9a9a]">Share your details and our team will prepare a tailored proposal.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={leadData.name} onChange={e => setLeadData(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
                <input value={leadData.company} onChange={e => setLeadData(p => ({ ...p, company: e.target.value }))} placeholder="Company name" className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
                <input value={leadData.email} onChange={e => setLeadData(p => ({ ...p, email: e.target.value }))} placeholder="Email *" type="email" className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
                <input value={leadData.phone} onChange={e => setLeadData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50" />
              </div>
              <button onClick={submitLead} disabled={!leadData.name || !leadData.email} className="w-full py-2.5 rounded-lg bg-[#991930] text-white text-sm font-medium hover:bg-[#a83d1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Get My Free Assessment
              </button>
            </div>
          )}

          {leadSubmitted && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-sm p-4 text-center animate-fade-in-up">
              <div className="text-green-400 font-semibold text-sm">Thank you!</div>
              <p className="text-xs text-[#9a9a9a] mt-1">Our team will contact you within 24 hours.</p>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {quickReplies && quickReplies.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 flex gap-2 flex-wrap animate-fade-in-up">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => sendMessage(reply)}
                className="px-3 py-1.5 rounded-full border border-[#991930]/30 text-xs text-[#991930] hover:bg-[#991930]/10 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Type your message...'}
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 rounded-lg bg-[#991930] text-white text-sm font-medium hover:bg-[#a83d1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
