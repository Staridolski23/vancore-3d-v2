'use client';

const items = [
  {
    title: 'Security-first',
    description: 'AES-256 encryption, EU hosting, JWT+RBAC authentication.',
    icon: '🛡️',
  },
  {
    title: 'Transparent pricing',
    description: 'Fixed monthly packages. No hidden fees, cancel anytime.',
    icon: '💎',
  },
  {
    title: 'Industry expertise',
    description: 'Built for HoReCa, logistics, and e-commerce operations.',
    icon: '🎯',
  },
  {
    title: 'Fast deployment',
    description: 'Operational within 7 days, not 6 months.',
    icon: '🚀',
  },
];

export default function TrustSection() {
  return (
    <section className="bg-white border-t border-[#e5e5e5] py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-[#111] mb-12">
          Why companies trust Vancore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.title} className="text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-[#111] mb-2">{item.title}</h3>
              <p className="text-sm text-[#6b6b6b] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
