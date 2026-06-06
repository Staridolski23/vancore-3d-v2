'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

type Case = {
  id: string;
  company: string;
  industry: string;
  problem: string;
  status: string;
  date: string;
  analysis?: string;
  created_at?: string;
};

export default function AdminCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/cases`)
      .then(res => res.json())
      .then(data => {
        setCases(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    analyzed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  const statusLabels: Record<string, string> = { analyzed: 'Анализиран', completed: 'Завършен' };

  const selected = cases.find(c => c.id === selectedId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Казуси ({cases.length})</h2>
      {loading ? (
        <div className="text-center py-12 text-vancore-muted">Зареждане...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 text-vancore-muted">Няма казуси</div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-vancore-muted">{c.industry}</span>
                    <h3 className="font-bold text-sm">{c.company}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[c.status] || 'bg-white/5 text-vancore-muted border-white/10'}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-sm text-vancore-muted">{c.problem}</p>
                  <p className="text-xs text-vancore-muted mt-1">{c.date}</p>
                </div>
                <button onClick={() => setSelectedId(c.id)} className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors">Преглед</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedId(null)}>
          <div className="glass rounded-3xl border border-white/10 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Казус: {selected.company}</h3>
            <div className="space-y-2 text-sm text-vancore-muted">
              <p><span className="text-vancore-light">Отрасъл:</span> {selected.industry}</p>
              <p><span className="text-vancore-light">Проблем:</span> {selected.problem}</p>
              <p><span className="text-vancore-light">Статус:</span> {selected.status}</p>
              <p><span className="text-vancore-light">Дата:</span> {selected.date}</p>
              {selected.analysis && <p><span className="text-vancore-light">Анализ:</span> {selected.analysis}</p>}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedId(null)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10">Затвори</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
