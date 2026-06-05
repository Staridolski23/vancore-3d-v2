'use client';

const cases = [
  { id: 1, company: 'Ресторант "Столова"', industry: 'HoReCa', problem: 'Губи 30% персонал всяка година', status: 'analyzed', date: '2026-06-05' },
  { id: 2, company: 'Fashion BG', industry: 'E-commerce', problem: '15% грешки в поръчки', status: 'completed', date: '2026-06-04' },
  { id: 3, company: 'CodeBase', industry: 'IT', problem: 'Ниска продуктивност', status: 'analyzed', date: '2026-06-03' },
];

const statusColors: Record<string, string> = {
  analyzed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};
const statusLabels: Record<string, string> = { analyzed: 'Анализиран', completed: 'Завършен' };

export default function AdminCases() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Казуси ({cases.length})</h2>
      <div className="space-y-3">
        {cases.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-vancore-muted">{c.industry}</span>
                  <h3 className="font-bold text-sm">{c.company}</h3>
                </div>
                <p className="text-sm text-vancore-muted">{c.problem}</p>
                <p className="text-xs text-vancore-muted mt-1">{c.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                <button className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors">Преглед</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
