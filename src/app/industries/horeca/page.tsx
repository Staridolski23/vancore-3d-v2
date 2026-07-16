import Link from 'next/link';

const pains = [
  { title: 'Reservations and table turnover', desc: 'Missed bookings, no-shows, and manual intake slow your front-of-house down.' },
  { title: 'Staff scheduling and ops handoffs', desc: 'Shift swaps, last-minute changes, and unclear handover notes create cost leaks.' },
  { title: 'Supplier and inventory tracking', desc: 'Stockouts and over-ordering hurt margins and guest experience alike.' },
  { title: 'Guest experience consistency', desc: 'Repeat customers expect the same quality across locations and channels.' },
];

const solutions = [
  { title: 'Booking & client pipeline', desc: 'Centralized reservations, status tracking, and client history in one place.' },
  { title: 'Operations workflows', desc: 'Automated shift prep, checklist handoffs, and status-based task routing.' },
  { title: 'Document management', desc: 'Contracts, supplier docs, and audit trails stored and versioned safely.' },
  { title: 'AI-assisted insights', desc: 'Pattern detection across bookings, complaints, and utilization to guide decisions.' },
];

export default function HoReCaIndustry() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">— INDUSTRIES</div>
          <h1 className="font-display text-5xl md:text-6xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            HoReCa <span className="text-[#991930]">operations</span>, clarified.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            Built for restaurants, hotels, and hospitality teams that want fewer fires, better bookings, and consistent guest experience.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/contact" className="px-5 py-2.5 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">Talk to us</Link>
            <Link href="/services" className="px-5 py-2.5 border border-[#111] text-[#111] text-sm font-medium rounded-lg hover:bg-[#111] hover:text-white transition-colors">See services</Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] leading-[1.08] mb-10">Common operational pain points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pains.map((p) => (
              <div key={p.title} className="border border-[#e5e5e5] rounded-sm p-6">
                <h3 className="font-display text-xl text-[#111] mb-2">{p.title}</h3>
                <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] leading-[1.08] mb-10">Where VANCORE helps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="border border-[#e5e5e5] bg-white rounded-sm p-6">
                <h3 className="font-display text-lg text-[#111] mb-2">{s.title}</h3>
                <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Ready to tighten operations?</h2>
          <p className="font-sans text-base text-[#6b6b6b] mb-8 max-w-md mx-auto">
            Tell us your situation. We'll tell you honestly if we are a fit.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
            Book a call
          </Link>
        </div>
      </section>
    </main>
  );
}
