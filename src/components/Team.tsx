'use client';

const members = [
  { name: 'Momchil Starolydolski', role: 'Co-founder & Operations' },
  { name: 'Zhanet Topalova', role: 'Co-founder & Delivery' },
];

export default function Team() {
  return (
    <section id="about" className="bg-white py-20 md:py-28 border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="text-[#c94f2b] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — ABOUT
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-4">
              Two founders.
            </h2>
            <p className="font-display text-xl md:text-2xl text-[#111] italic mb-5">
              Hands-on, not hands-off.
            </p>
            <p className="mt-5 font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-md">
              We&apos;re a husband-and-wife consultancy built for the problems that don&apos;t show up in standard dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {members.map((member) => (
              <div key={member.name} className="border border-[#e5e5e5] rounded-sm p-6">
                <div className="aspect-square bg-[#e5e5e5] rounded-sm mb-5" />
                <h3 className="font-display text-xl text-[#111]">{member.name}</h3>
                <p className="text-xs text-[#6b6b6b] mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
