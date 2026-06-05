'use client';

const leads = [
  { id: 1, name: 'Иван Петров', company: 'Ресторант "Столова"', email: 'ivan@stolova.bg', budget: '1,000-3,000 EUR', status: 'new', date: '2026-06-05' },
  { id: 2, name: 'Мария Георгиева', company: 'E-commerce "Fashion BG"', email: 'maria@fashion.bg', budget: '3,000-10,000 EUR', status: 'contacted', date: '2026-06-04' },
  { id: 3, name: 'Димитър Стефанов', company: 'IT Стартап "CodeBase"', email: 'dim@codebase.bg', budget: '10,000+ EUR', status: 'qualified', date: '2026-06-03' },
  { id: 4, name: 'Анна Николова', company: 'HoReCa "Hotel Lux"', email: 'anna@hotellux.bg', budget: '1,000-3,000 EUR', status: 'new', date: '2026-06-02' },
];

const statusColors: Record<string, string> = {
  new: 'bg-green-500/20 text-green-400 border-green-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};
const statusLabels: Record<string, string> = { new: 'Нов', contacted: 'Свързан', qualified: 'Квалифициран' };

export default function AdminLeads() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Лийдове ({leads.length})</h2>
        <div className="flex gap-2">
          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-vancore-muted">
            <option>Всички</option>
            <option>Нови</option>
            <option>Свързани</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <div key={lead.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-vancore-bronze/20 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-vancore-light">{lead.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[lead.status]}`}>{statusLabels[lead.status]}</span>
                </div>
                <p className="text-sm text-vancore-muted">{lead.company}</p>
                <p className="text-xs text-vancore-muted mt-1">{lead.email} • {lead.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full bg-vancore-bronze/10 text-vancore-bronze border border-vancore-bronze/20">{lead.budget}</span>
                <button className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs hover:bg-vancore-bronze/20 transition-colors">Детайли</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
