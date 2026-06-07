'use client';

import { useState, useEffect } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function AdminAnalysis() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/analyses`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-vancore-muted">Зареждане...</p>;
  if (!data.length) return <p className="text-sm text-vancore-muted">Няма анализирани казуси още.</p>;

  const industryCounts = ['HoReCa', 'E-commerce', 'IT', 'SME'].map((industry) => {
    const count = data.filter((item) => item.industry === industry).length;
    const pct = Math.round((count / data.length) * 100);
    return { industry, count, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Оборот по отрасли</h2>
        <div className="grid grid-cols-2 gap-3">
          {industryCounts.map(({ industry, pct }) => (
            <div key={industry} className="glass rounded-2xl p-4 border border-white/5">
              <div className="font-semibold text-sm mb-1">{industry}</div>
              <div className="text-2xl font-black text-vancore-gold">{pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
