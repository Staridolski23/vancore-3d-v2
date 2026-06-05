'use client';

import { useState } from 'react';

type Case = {
  id: number;
  company: string;
  industry: string;
  problem: string;
  status: string;
  date: string;
};

type Props = {
  case: Case;
  onClose: () => void;
};

export default function CaseDetailsModal({ case: c, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass rounded-3xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-xl font-bold">{c.company}</h3>
              <p className="text-sm text-vancore-muted">{c.industry}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-vancore-muted hover:text-vancore-light transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-bold mb-2 text-vancore-bronze">Проблем</h4>
            <p className="text-sm text-vancore-muted">{c.problem}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Статус</div>
              <div className="text-sm font-semibold">{c.status}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Дата</div>
              <div className="text-sm font-semibold">{c.date}</div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-vancore-bronze/10 bg-vancore-bronze/5">
            <h4 className="text-sm font-bold mb-2">🎯 AI Анализ (демо)</h4>
            <div className="space-y-2 text-sm text-vancore-muted">
              <p>• Основна причина: липса на системен подход в {c.industry}</p>
              <p>• Загуби: ~2,500 EUR/месец</p>
              <p>• Препоръка: въвеждане на структуриран процес + AI автоматизация</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all">Свържи се за реализация</button>
            <button className="px-4 py-2.5 glass border border-white/10 text-vancore-muted rounded-xl text-sm hover:text-vancore-light transition-colors">Изтегли PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
