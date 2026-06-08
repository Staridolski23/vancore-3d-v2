'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

type Case = { id: string; company: string; industry: string; problem: string; status: string; date: string; analysis?: string };

export default function CaseDetailsModal({ caseId, onClose }: { caseId: string | null; onClose: () => void }) {
  const [data, setData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    fetch(`${API_URL}/cases/${caseId}`)
      .then((res) => res.json())
      .then((item) => setData(item))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (!caseId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-3xl border border-white/10 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Преглед на казус</h3>
        {loading ? <div className="text-sm text-vancore-muted">Зареждане...</div> : (
          <div className="space-y-2 text-sm text-vancore-muted">
            <p><span className="text-vancore-light">Компания:</span> {data?.company || ''}</p>
            <p><span className="text-vancore-light">Отрасъл:</span> {data?.industry || ''}</p>
            <p><span className="text-vancore-light">Проблем:</span> {data?.problem || ''}</p>
            <p><span className="text-vancore-light">Статус:</span> {data?.status || ''}</p>
            <p><span className="text-vancore-light">Дата:</span> {data?.date || ''}</p>
            {data?.analysis && <p><span className="text-vancore-light">Анализ:</span> {data.analysis}</p>}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10">Затвори</button>
        </div>
      </div>
    </div>
  );
}
