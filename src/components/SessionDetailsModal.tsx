'use client';

import { useState } from 'react';

type Session = {
  id: number;
  time: string;
  user: string;
  topic: string;
  messages: number;
};

type Props = {
  session: Session;
  onClose: () => void;
};

export default function SessionDetailsModal({ session, onClose }: Props) {
  const chatLog = [
    { from: 'user', text: 'Имаме проблем с персонала в ресторанта.' },
    { from: 'ai', text: 'Разбирам! Опишете по-подробно ситуацията — кога започнаха проблемите и какви са основните симптоми?' },
    { from: 'user', text: 'Губим 30% от служителите всяка година. Новите остават 2-3 месеца и си тръгват.' },
    { from: 'ai', text: 'Това е типичен HR криза в HoReCa. Основната причина е липсваща система за онбординг и мотивация. Загубата: ~8,000 EUR/година.' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass rounded-3xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-sm">🤖</div>
            <div>
              <h3 className="text-lg font-bold">AI Сесия — {session.topic}</h3>
              <p className="text-xs text-vancore-muted">{session.time} • {session.user}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-vancore-muted hover:text-vancore-light transition-colors">✕</button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.from === 'user' ? 'justify-end' : ''}`}>
              {msg.from === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center text-xs shrink-0">🤖</div>}
              <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${msg.from === 'user' ? 'bg-vancore-bronze/20 rounded-tr-sm' : 'bg-white/5 rounded-tl-sm'}`}>
                <p className="text-sm text-vancore-muted">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs text-vancore-muted">Обобщение: 4 съобщения • ~2 мин</span>
          <button className="px-4 py-2 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold rounded-xl text-sm">Запази като казус</button>
        </div>
      </div>
    </div>
  );
}
