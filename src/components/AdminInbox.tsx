'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type IncomingMessage = {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  type: string;
  created_at: string;
};

export default function AdminInbox() {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/incoming`);
      const data = await res.json();
      setMessages(data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (id: string) => {
    const text = replyTexts[id];
    if (!text?.trim()) return;

    try {
      await fetch(`${API_URL}/incoming/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: text }),
      });

      setReplyTexts(prev => ({ ...prev, [id]: '' }));
      alert('Отговорът е запазен. Моля, изпратете имейла ръчно през вашия клиент.');
    } catch (err) {
      alert('Грешка при запазване на отговора.');
    }
  };

  const sendEmail = (msg: IncomingMessage) => {
    const replyBody = replyTexts[msg.id] || 'Благодаря за вашето запитване. Ще се свържем с вас скоро.';
    window.open(`mailto:${msg.sender_email}?subject=Re: ${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(replyBody)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Входящи ({messages.length})</h2>
        <button onClick={fetchMessages} className="px-3 py-1.5 glass border border-white/10 text-xs text-vancore-muted rounded-lg hover:text-vancore-light transition-colors">Обнови</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-vancore-muted">Зареждане...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-vancore-muted">Няма входящи съобщения</div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-vancore-light">{msg.sender_name || 'Анонимен'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-vancore-muted">{msg.type}</span>
                  </div>
                  <p className="text-xs text-vancore-muted">{msg.sender_email}</p>
                  <h4 className="text-sm font-semibold mt-2">{msg.subject}</h4>
                  <p className="text-sm text-vancore-muted mt-1">{msg.message}</p>
                  <p className="text-[10px] text-vancore-muted mt-2">{new Date(msg.created_at).toLocaleString('bg-BG')}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => sendEmail(msg)} className="px-3 py-2 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark rounded-lg text-xs font-semibold hover:shadow-lg transition-all">Отговори с имейл</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
