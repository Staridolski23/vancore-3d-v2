'use client';

const cases = [
  { client: 'Coastal Hotel Group', result: 'Housekeeping efficiency +31% in 6 weeks' },
  { client: 'Metro Retail', result: 'Support tickets down 24%' },
  { client: 'B2B SaaS', result: 'Pipeline visibility restored for leadership' },
  { client: 'Regional Hospital', result: 'Scheduling bottlenecks removed' },
];

export default function Work() {
  return (
    <section id="work" className="bg-[#050505] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-[#c94f2b] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
          — CASES
        </div>
        <h2 className="font-display text-4xl md:text-5xl text-white leading-[1.08] mb-10">Selected work</h2>
        <div className="divide-y divide-white/5">
          {cases.map((item) => (
            <div key={item.client} className="py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="font-display text-xl text-white">{item.client}</div>
              <div className="text-sm text-[#9a9a9a]">{item.result}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
