'use client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { BarChart3, GitBranch, Brain, Handshake } from 'lucide-react';

export default function Services() {
  const { getSection } = useSiteContent();
  const section = getSection('services');
  const title = section?.title || 'Four practices.';
  const subtitle = section?.subtitle || 'One outcome.';

  const practices = [
    { number: '01', title: 'Business Analysis', icon: BarChart3 },
    { number: '02', title: 'Process Re-engineering', icon: GitBranch },
    { number: '03', title: 'AI-Powered Diagnostics', icon: Brain },
    { number: '04', title: 'Change Enablement', icon: Handshake },
  ];

  return (
    <section id="services" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-16">
          <div className="md:max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#991930]" />
              <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#991930]">
                — WHAT WE DO
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-3">
              {title}
            </h2>
            <p className="font-display text-2xl md:text-3xl text-[#111] italic">{subtitle}</p>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {practices.map((practice) => {
              const Icon = practice.icon;
              return (
                <div
                  key={practice.number}
                  className="border border-[#e5e5e5] rounded-sm p-6 md:p-8 hover:border-[#991930]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-[#991930]" strokeWidth={1.5} />
                    <span className="text-[#991930] font-display text-sm">{practice.number}</span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl text-[#111]">{practice.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
