'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = localStorage.getItem('vancore_client_token');

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      // Load chat history
      fetch('/api/chat/history')
        .then(res => res.json())
        .then(data => {
          if (data.messages) setMessages(data.messages);
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('vancore_client_token') || '';
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.reply) {
        const adminMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'admin',
          text: data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, adminMsg]);
      }
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'admin',
        text: 'Sorry, our team is currently unavailable. Please try again later or email hello@vancoresys.com',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setUnread(0); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#991930] text-white rounded-full shadow-lg hover:bg-[#a83d1f] transition-all flex items-center justify-center"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-[10px] rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-[#111] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#991930] flex items-center justify-center text-sm">V</div>
            <div>
              <div className="text-sm font-semibold text-white">VANCORE Support</div>
              <div className="text-[10px] text-[#10b981]">● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-[#6b6b6b] text-sm py-8">
                <p>👋 Hello!</p>
                <p className="mt-1">How can we help you today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#991930] text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-3 py-2 rounded-lg text-sm text-[#9a9a9a]">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="px-3 py-2 bg-[#991930] text-white rounded-lg hover:bg-[#a83d1f] disabled:opacity-50 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
