'use client';

const items = [
  { value: '8+', label: 'YEARS EMBEDDED' },
  { value: '47', label: 'ENGAGEMENTS DELIVERED' },
  { value: '92%', label: 'CLIENT RETENTION' },
  { value: '2', label: 'FOUNDERS, HANDS-ON' },
];

export default function Stats() {
  return (
    <section className="border-y border-[#e5e5e5] bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e5e5]">
          {items.map((item, idx) => (
            <div key={idx} className="py-10 md:py-14 px-4 md:px-6 text-center">
              <div className="font-display text-4xl md:text-5xl text-[#111] mb-3">
                {item.value}
              </div>
              <div className="h-px w-8 bg-[#991930] mx-auto mb-3" />
              <div className="text-[11px] sm:text-xs font-sans font-medium text-[#6b6b6b] tracking-[0.15em] uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
