'use client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Hotel, ShoppingCart, Building2, Cpu } from 'lucide-react';

const industries = [
  { id: 'horeca', name: 'Hospitality & F&B', desc: 'Operational friction in hotels and restaurants often hides behind guest-facing perfection.', icon: Hotel },
  { id: 'ecommerce', name: 'Commerce', desc: 'Returns, support overload, and messy order flows silently drain margin.', icon: ShoppingCart },
  { id: 'sme', name: 'SME', desc: 'Founders carry knowledge that never makes it into process or tooling.', icon: Building2 },
  { id: 'it', name: 'Technology', desc: 'Delivery pressure can outpace communication and alignment.', icon: Cpu },
];

export default function Industries() {
  const { getSection } = useSiteContent();
  const section = getSection('industries');
  const title = section?.title || 'Where we show up';
  const subtitle = section?.subtitle || 'We work wherever complexity is hiding in plain sight.';

  return (
    <section className="bg-[#050505] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-white leading-[1.08]">{title}</h2>
            <p className="mt-5 font-sans text-base text-[#9a9a9a] leading-relaxed max-w-md">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {industries.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="border border-white/5 rounded-sm p-5 hover:border-[#991930]/40 transition-colors">
                  <Icon className="w-5 h-5 text-[#991930] mb-3" strokeWidth={1.5} />
                  <div className="font-display text-lg text-white mb-2">{item.name}</div>
                  <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
