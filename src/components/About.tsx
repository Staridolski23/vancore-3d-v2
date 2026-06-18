'use client';

export default function About() {
  return (
    <section id="about" className="bg-white py-20 md:py-28 border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="text-[#c94f2b] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — ABOUT
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05]">
              A boutique business analysis & development consultancy.
            </h2>
            <p className="mt-5 font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-md">
              We help companies see clearly through their internal complexity — and act on what they find.
            </p>
          </div>
          <div className="border border-[#e5e5e5] rounded-sm p-6 md:p-8">
            <div className="text-xs text-[#6b6b6b] leading-relaxed">
              Operating at the intersection of operations, technology, and people. We stay small by design so we can stay close to the work.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
