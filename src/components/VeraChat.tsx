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

const SUBSCRIPTION_PLANS = [
  {
    id: 'payg',
    name: 'Pay-As-You-Go',
    price: 25,
    unit: '500 questions',
    description: 'One-time credit, no subscription',
    features: ['500 AI questions', 'No monthly commitment', 'Valid for 3 months'],
    popular: false,
    color: 'bronze'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    unit: '/month',
    description: 'For active business owners',
    features: ['Unlimited AI questions', 'Monthly business report', 'Client portal access', 'Priority support (4h)', 'Templates & tools'],
    popular: true,
    color: 'silver'
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    unit: '/month',
    description: 'For growing businesses',
    features: ['Everything in Professional', 'Weekly auto-analysis', '2 human consultant calls/month', 'Growth plan', 'CRM integrations', 'Case studies & playbooks'],
    popular: false,
    color: 'gold'
  }
];

export default function VeraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState(0);
  const [quickReplies, setQuickReplies] = useState<string[] | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({ 
    name: '', 
    company: '', 
    email: '', 
    phone: '',
    consentTerms: false,
    consentData: false,
    consentMarketing: false
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isTyping, quickReplies, showSubscription, scrollToBottom]);

  const submitLead = async () => {
    if (!leadData.name.trim() || !leadData.email.trim()) return;
    
    setIsTyping(true);
    
    try {
      await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Lead submitted, start conversation', 
          leadData 
        }),
      });
    } catch {}
    
    setLeadSubmitted(true);
    setStep(1);
    
    setTimeout(async () => {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', sessionId: '' }),
      });
      const data = await res.json();
      
      // Add AI disclosure to first message
      const aiDisclosure = '\n\n🤖 *I am an AI assistant. For complex business decisions, consult with our team of experts.*';
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        text: data.reply + (data.step === 2 ? aiDisclosure : ''), 
        ts: new Date().toISOString() 
      };
      setMessages([assistantMsg]);
      setSessionId(data.sessionId || '');
      setStep(data.step || 1);
      setQuickReplies(data.quickReplies || null);
      setPlaceholder(data.placeholder || '');
      setIsTyping(false);
    }, 500);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || chatLocked) return;

    const userMsg: Message = { role: 'user', text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setQuickReplies(null);

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      await new Promise(resolve => setTimeout(resolve, 800));

      const assistantMsg: Message = { role: 'assistant', text: data.reply, ts: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      setSessionId(data.sessionId || '');
      setStep(data.step || 1);
      setQuickReplies(data.quickReplies || null);
      setPlaceholder(data.placeholder || '');
      
      // Show subscription after analysis (step 7+)
      if (data.step >= 7) {
        setShowSubscription(true);
        setChatLocked(true);
      }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const selectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Redirect to client portal for registration/payment
    window.location.href = `/client-portal?plan=${planId}&email=${encodeURIComponent(leadData.email)}&name=${encodeURIComponent(leadData.name)}`;
  };

  // Check if user is logged in - skip lead capture
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            setIsLoggedIn(true);
            setUserProfile(data.user);
            setLeadData({
              name: data.user.name || '',
              company: data.user.company || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              consentTerms: true,
              consentData: true,
              consentMarketing: false
            });
            // Skip lead capture and start chat
            setLeadSubmitted(true);
            setStep(1);
            // Auto-start conversation
            setTimeout(async () => {
              const res = await fetch('/api/ai-analyst', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello', sessionId: '' }),
              });
              const data = await res.json();
              const assistantMsg: Message = { 
                role: 'assistant', 
                text: data.reply, 
                ts: new Date().toISOString() 
              };
              setMessages([assistantMsg]);
              setSessionId(data.sessionId || '');
              setStep(data.step || 1);
              setQuickReplies(data.quickReplies || null);
              setPlaceholder(data.placeholder || '');
            }, 500);
          });
        }
      }).catch(() => {});
    }
  }, []);

  // Step 0: Lead Capture Form (only for non-logged-in users)
  if (step === 0 && !leadSubmitted && !isLoggedIn) {
    return (
      <>
        <style jsx>{fadeStyle}</style>
        <div className="w-full flex flex-col bg-[#0a0a0a] rounded-sm border border-white/5">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
            <VeraAvatar className="w-8 h-8" />
            <div>
              <div className="text-sm font-semibold text-white">Vera AI</div>
              <div className="text-[10px] text-[#6b6b6b]">Business Analyst • VANCORE</div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to VANCORE AI Analyst</h3>
              <p className="text-sm text-[#9a9a9a]">Share your details to start your free AI business analysis. No spam — just actionable insights.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label htmlFor="vera-name" className="block text-xs text-[#9a9a9a] mb-1">Full name *</label>
                <input
                  id="vera-name"
                  name="name"
                  value={leadData.name}
                  onChange={e => setLeadData(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="vera-company" className="block text-xs text-[#9a9a9a] mb-1">Company name</label>
                <input
                  id="vera-company"
                  name="company"
                  value={leadData.company}
                  onChange={e => setLeadData(p => ({ ...p, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="vera-email" className="block text-xs text-[#9a9a9a] mb-1">Email *</label>
                <input
                  id="vera-email"
                  name="email"
                  type="email"
                  value={leadData.email}
                  onChange={e => setLeadData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
              <div>
                <label htmlFor="vera-phone" className="block text-xs text-[#9a9a9a] mb-1">Phone number</label>
                <input
                  id="vera-phone"
                  name="phone"
                  value={leadData.phone}
                  onChange={e => setLeadData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+359 888 123 456"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#991930]/50"
                />
              </div>
            </div>

            {/* GDPR Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={leadData.consentTerms}
                  onChange={e => setLeadData(p => ({ ...p, consentTerms: e.target.checked }))}
                  className="mt-0.5 w-5 h-5 rounded border-white/20 bg-[#1a1a1a] text-[#991930] focus:ring-[#991930]/50 flex-shrink-0"
                />
                <span className="text-xs sm:text-[11px] text-[#9a9a9a] leading-relaxed">
                  I agree to the <a href="/terms" className="text-[#991930] hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" className="text-[#991930] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a> *
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={leadData.consentData}
                  onChange={e => setLeadData(p => ({ ...p, consentData: e.target.checked }))}
                  className="mt-0.5 w-5 h-5 rounded border-white/20 bg-[#1a1a1a] text-[#991930] focus:ring-[#991930]/50 flex-shrink-0"
                />
                <span className="text-xs sm:text-[11px] text-[#9a9a9a] leading-relaxed">
                  I consent to the processing of my personal data for AI business analysis purposes *
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadData.consentMarketing}
                  onChange={e => setLeadData(p => ({ ...p, consentMarketing: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-[#991930] focus:ring-[#991930]/50"
                />
                <span className="text-[11px] text-[#9a9a9a] leading-relaxed">
                  I agree to receive business insights and updates from VANCORE (optional)
                </span>
              </label>
            </div>
            
            <button
              onClick={submitLead}
              disabled={!leadData.name.trim() || !leadData.email.trim() || !leadData.consentTerms || !leadData.consentData}
              className="w-full py-3 rounded-lg bg-[#991930] text-white font-semibold hover:bg-[#a83d1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start My Free AI Analysis
            </button>
            
            <p className="text-[10px] text-[#6b6b6b] text-center">
              By submitting, you agree to receive business analysis from VANCORE. We respect your privacy.
            </p>
          </div>
        </div>
      </>
    );
  }

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
          <div className="ml-auto flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#991930]/20 text-[#991930] font-medium">AI</span>
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#991930] text-white rounded-tr-sm' 
                  : 'bg-[#1a1a1a] text-white rounded-tl-sm border border-white/5'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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

          {/* Notification message before subscription */}
          {showSubscription && !selectedPlan && (
            <div className="bg-[#1a1a1a] border border-[#991930]/30 rounded-sm p-4 space-y-4 animate-fade-in-up">
              <div className="text-center">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="text-base font-semibold text-white mb-1">Your Analysis is Complete!</h4>
                <p className="text-xs text-[#9a9a9a]">
                  You've used your 5 free questions. To continue with detailed analysis and ongoing support, choose a plan below.
                </p>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          {showSubscription && !selectedPlan && (
            <div className="space-y-3 animate-fade-in-up">
              <h4 className="text-sm font-semibold text-white text-center">Choose Your Plan</h4>
              <div className="grid grid-cols-1 gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => selectPlan(plan.id)}
                    className={`relative w-full p-4 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                      plan.popular 
                        ? 'border-[#991930] bg-[#991930]/10' 
                        : 'border-white/10 bg-[#1a1a1a] hover:border-[#991930]/30'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#991930] text-white text-[10px] font-semibold rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-sm font-semibold text-white">{plan.name}</h5>
                        <p className="text-[10px] text-[#9a9a9a]">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">€{plan.price}</div>
                        <div className="text-[10px] text-[#9a9a9a]">{plan.unit}</div>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="text-[11px] text-[#9a9a9a] flex items-center gap-1.5">
                          <span className="text-green-400">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              
              <div className="text-center pt-2">
                <a 
                  href="https://vancoresys.com/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[#991930] hover:underline"
                >
                  Or book a free 30-minute consultation call →
                </a>
              </div>
            </div>
          )}

          {/* Chat locked message */}
          {chatLocked && selectedPlan && (
            <div className="text-center text-xs text-[#6b6b6b] animate-fade-in-up">
              Redirecting to subscription page...
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {quickReplies && quickReplies.length > 0 && !chatLocked && !showSubscription && (
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
          {chatLocked ? (
            <div className="text-center text-xs text-[#6b6b6b]">
              Chat ended. Choose a plan above to continue.
            </div>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="vera-chat-input" className="sr-only">Type your message</label>
              <input
                  id="vera-chat-input"
                  name="message"
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
          )}
        </div>
      </div>
    </>
  );
}
