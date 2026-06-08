'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function AdminAnalysis() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });
      const data = await res.json();
      setResult(data?.result || JSON.stringify(data));
    } catch (err) {
      setResult('Грешка при изпълнение на анализа.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI Анализ</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Опишете проблема за анализ..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-vancore-light focus:outline-none focus:border-vancore-bronze/40 min-h-[120px]"
      />
      <button onClick={runAnalysis} disabled={loading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold disabled:opacity-50">
        {loading ? 'Анализиране...' : 'Анализирай'}
      </button>
      {result && (
        <div className="glass rounded-2xl p-5 border border-white/5 text-sm text-vancore-muted whitespace-pre-line">{result}</div>
      )}
    </div>
  );
}
