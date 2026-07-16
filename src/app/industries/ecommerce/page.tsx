import Link from 'next/link';

const pains = [
  { title: 'Order and return complexity', desc: 'Fragmented order workflows create delays and inconsistent customer experience.' },
  { title: 'Customer support volume', desc: 'Recurring questions and returns strain support without process support.' },
  { title: 'Catalog and promotion drift', desc: 'Pricing, stock, and campaign status diverge across channels.' },
  { title: 'Operations reporting', desc: 'Deciding what to fix is hard when metrics live in many tools.' },
];

const solutions = [
  { title: 'Booking & client pipeline', desc: 'Order intake, follow-up scheduling, and client history in one tool.' },
  { title: 'Document automation', desc: 'Returns, invoices, and policies stored and retrievable with audit context.' },
  { title: 'AI-assisted insights', desc: 'Operational signals from orders, support, and shipping to prioritize fixes.' },
  { title: 'Analytics & reporting', desc: 'Conversion paths, drop-off points, and exception rates surfaced clearly.' },
];

export default function EcommerceIndustry() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">— INDUSTRIES</div>
          <h1 className="font-display text-5xl md:text-6xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            E-commerce <span className="text-[#991930]">operations</span>, clarified.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            Built for e-commerce teams that want fewer operational fires, cleaner documentation, and smarter support decisions.
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
