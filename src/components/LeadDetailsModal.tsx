'use client';

import { useState } from 'react';

type Lead = {
  id: number;
  name: string;
  company: string;
  email: string;
  budget: string;
  status: string;
  date: string;
};

type Props = {
  lead: Lead;
  onClose: () => void;
};

export default function LeadDetails({ lead, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-3xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Детайли за лийда</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-vancore-muted hover:text-vancore-light transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#991930]/20 to-[#991930]/20 flex items-center justify-center text-2xl">👤</div>
            <div>
              <h4 className="text-lg font-bold">{lead.name}</h4>
              <p className="text-sm text-vancore-muted">{lead.company}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Имейл</div>
              <div className="text-sm font-semibold">{lead.email}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Дата</div>
              <div className="text-sm font-semibold">{lead.date}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Бюджет</div>
              <div className="text-sm font-semibold text-vancore-bronze">{lead.budget}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-vancore-muted mb-1">Статус</div>
              <div className="text-sm font-semibold">{lead.status}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h5 className="text-sm font-bold mb-2">Бележки</h5>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vancore-bronze/40 resize-none" rows={3} placeholder="Добави бележки..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#991930] to-[#991930] text-vancore-dark font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-vancore-bronze/20 transition-all">Свържи се</button>
            <button className="px-4 py-2.5 glass border border-white/10 text-vancore-muted rounded-xl text-sm hover:text-vancore-light transition-colors">Изпрати имейл</button>
          </div>
        </div>
      </div>
    </div>
  );
}
