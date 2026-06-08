'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  budget: string;
  status: string;
  date: string;
  notes?: string;
  created_at?: string;
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`);
      const data = await res.json();
      setLeads(data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<string, string> = {
    new: 'bg-green-500/20 text-green-400 border-green-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  const statusLabels: Record<string, string> = { new: 'Нов', contacted: 'Свързан', qualified: 'Квалифициран' };

  const filtered = statusFilter === 'all' ? leads : leads.filter(l => l.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Лийдове ({leads.length})</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-vancore-muted"
        >
          <option value="all">Всички</option>
          <option value="new">Нови</option>
          <option value="contacted">Свързани</option>
          <option value="qualified">Квалифицирани</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-vancore-muted">Зареждане...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-vancore-muted">Няма лийдове</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-vancore-light">{lead.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </div>
                  <p className="text-sm text-vancore-muted">{lead.company}</p>
                  <p className="text-xs text-vancore-muted mt-1">{lead.email} • {lead.date}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-full bg-vancore-bronze/10 text-vancore-bronze border border-vancore-bronze/20">
                    {lead.budget || 'Не е посочено'}
                  </span>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-vancore-muted"
                  >
                    <option value="new">Нов</option>
                    <option value="contacted">Свързан</option>
                    <option value="qualified">Квалифициран</option>
                  </select>
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors"
                  >
                    Детайли
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
          <div className="glass rounded-3xl border border-white/10 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Детайли на лийд</h3>
            <div className="space-y-2 text-sm text-vancore-muted">
              <p><span className="text-vancore-light">Име:</span> {selectedLead.name}</p>
              <p><span className="text-vancore-light">Компания:</span> {selectedLead.company}</p>
              <p><span className="text-vancore-light">Имейл:</span> {selectedLead.email}</p>
              <p><span className="text-vancore-light">Бюджет:</span> {selectedLead.budget}</p>
              <p><span className="text-vancore-light">Статус:</span> {selectedLead.status}</p>
              <p><span className="text-vancore-light">Дата:</span> {selectedLead.date}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedLead(null)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10">Затвори</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
