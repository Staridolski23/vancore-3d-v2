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
    {
      from: 'ai',
      text: 'Здравейте! Аз съм AI бизнес анализатор на VANCORE. За да ви дам реален анализ, моля отговорете на няколко въпроса.\n\n1. В кой отрасъл работи? (HoReCa / E-commerce / SME / IT)\n2. Какъв е основният проблем в момента?',
      time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'industry' | 'problem' | 'deep'>('industry');
  const [industry, setIndustry] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userText = input.trim();
    const userMsg: Message = {
      from: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const lower = userText.toLowerCase();

      if (step === 'industry') {
        const mapped = lower.includes('hore') || lower.includes('рестор') ? 'HoReCa'
          : lower.includes('е-ком') || lower.includes('ecom') ? 'E-commerce'
          : lower.includes('it') || lower.includes('софтуер') ? 'IT'
          : lower.includes('сме') || lower.includes('sme') ? 'SME'
          : null;

        setIndustry(mapped || userText);
        setMessages(prev => [...prev, {
          from: 'ai',
          text: mapped
            ? `Разбрах - отрасъл: ${mapped}. Сега моля опишете основния проблем на бизнеса (например: загуба на клиенти, ниски продажби, висок разход).`
            : 'Моля, посочете по-конкретно отрасъла, за да ви дам по-точен анализ.',
          time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
        }]);
        setStep('problem');
      } else if (step === 'problem') {
        const analysis = buildProblemAnalysis(industry, userText);
        setMessages(prev => [...prev, {
          from: 'ai',
          text: analysis,
          time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
        }]);
        setStep('deep');
      } else {
        const deep = buildDeepAnalysis(industry, userText);
        setMessages(prev => [...prev, {
          from: 'ai',
          text: deep,
          time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }

      await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: userText, messages_count: messages.length + 1 }),
      });

      await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: 'AI Chat User',
          sender_email: 'chat@vancore.ai',
          subject: `AI Chat: ${userText.slice(0, 50)}`,
          message: userText,
          type: 'ai_chat',
        }),
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'ai',
        text: 'Извинете, има техническо нарушение. Моля, опитайте отново.',
        time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const buildProblemAnalysis = (ind: string, problem: string) => {
    if (ind === 'HoReCa') {
      return `HoReCa анализ:\n\n• Проблем: ${problem}\n• Типични загуби: 15-20% от оборот\n• Причина: операционни загуби и високо отклонение на персонала\n\nПрепоръка:\n1. Въведете стандартизирани процеси на обслужване.\n2. Автоматизирайте наличностите и разписанията.\n3. Добавете програма за лоялност на клиенти.`;
    }
    if (ind === 'E-commerce') {
      return `E-commerce анализ:\n\n• Проблем: ${problem}\n• Типични загуби: 8-12% от онлайн оборота\n• Причина: логистика, inertia в покупки и ниска конверсия\n\nПрепоръка:\n1. Подобрете checkout flow и mobile UX.\n2. Добавете автоматични известия за поръчки.\n3. Стартирайте ретаргетинг кампания.`;
    }
    if (ind === 'IT') {
      return `IT анализ:\n\n• Проблем: ${problem}\n• Типични загуби: 10-15% от development capacity\n• Причина: техноложки дълг, непредвидими bug-ове и забавено внедряване\n\nПрепоръка:\n1. Въведете CI/CD и code review.\n2. Разделете legacy код от нов разработване.\n3. Добавете мониторинг и алърти.`;
    }
    return `SME анализ:\n\n• Проблем: ${problem}\n• Типични загуби: 3-5к EUR/мес\n• Причина: недостатъчна автоматизация, ресorce dependency и слаба отчетност\n\nПрепоръка:\n1. Въведете базово CRM.\n2. Автоматизирайте фактуриране и известия.\n3. Започнете с еднодневни/weekly обобщения на ключови метрики.`;
  };

  const buildDeepAnalysis = (ind: string, text: string) => {
    if (ind === 'HoReCa') return 'За дълбок анализ на HoReCa нужен е официален казус. Мога да ви помогна с:\n• Стандарти на обслужване\n• Управление на персонала\n• Оптимизация на наличности\nИскате да го активирате като тестов казус?';
    if (ind === 'E-commerce') return 'За дълбок анализ на E-commerce мога да ви дам конкретни стъпки, но за препоръки с цифри нужен е кратка метрика:\n• Средна поръчка\n• Конверсия\n• Cart abandonment %\nИскате да продължим по този път?';
    if (ind === 'IT') return 'За дълбок IT анализ можем да разгледаме:\n• Release cadence\n• MTTR\n• Оптимизация на процеси\nИскате да разширим с конкретни цифри?';
    return 'За дълбок SME анализ мога да ви поискам 3-4 клюзови цифри (оборот, брои служители, средна транзакция) и да ви дам първоначални стъпки.';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold text-vancore-dark flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-vancore-bronze/30 transition-all"
      >
        <span className="text-2xl">💬</span>
      </button>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-md">
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-sm">VANCORE AI анализатор</h3>
                <p className="text-xs text-vancore-muted">Отговорите се записват автоматично</p>
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
                  placeholder="Напишете отговора..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40"
                />
                <button onClick={sendMessage} disabled={sending} className="px-4 py-2.5 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark rounded-xl text-sm font-semibold disabled:opacity-50">Изпрати</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
