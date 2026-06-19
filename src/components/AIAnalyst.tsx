'use client';

import Link from 'next/link';

const questions = [
  'What is the actual decision that keeps getting delayed?',
  'Who is closest to the problem, and what do they already know?',
  'Where does work get reinterpreted between teams?',
  'What would good look like in 60 days?',
];

export default function AIAnalyst() {
  return (
    <section id="ai-analyst" className="bg-white py-20 md:py-28 border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="text-[#c94f2b] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">
              — AI ANALYST
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-4">
              Meet Vera.
            </h2>
            <p className="font-display text-xl md:text-2xl text-[#111] italic mb-5">
              Our AI does the preliminary work, so we don&apos;t waste yours.
            </p>
            <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-md">
              Vera is our AI business analyst. In five to seven sharp questions, she maps the contours of your problem and prepares a brief so our human consultants arrive informed — not introducing themselves.
            </p>
            <Link href="/ai-analyst">
              <button className="inline-flex items-center gap-2 mt-8 px-5 py-3 bg-[#c94f2b] text-white text-sm font-sans font-medium hover:bg-[#a83d1f] transition-colors">
              Talk to Vera
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-[-45deg]"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </button>
            </Link>
          </div>
          <div className="border border-[#e5e5e5] rounded-sm overflow-hidden">
            <div className="bg-[#f7f6f2] px-4 py-3 border-b border-[#e5e5e5]">
              <div className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#6b6b6b] uppercase">Live preview</div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e5e5e5] shrink-0" />
                <div className="rounded-2xl rounded-tl-sm bg-[#f7f6f2] border border-[#e5e5e5] px-4 py-3 text-sm text-[#111]">
                  Hello — I&apos;m Vera. May I ask a few quick questions to understand what&apos;s happening inside your company?
                </div>
              </div>
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-[#111] shrink-0" />
                <div className="rounded-2xl rounded-tr-sm bg-[#111] text-white px-4 py-3 text-sm">
                  Our ops team is constantly firefighting.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e5e5e5] shrink-0" />
                <div className="rounded-2xl rounded-tl-sm bg-[#f7f6f2] border border-[#e5e5e5] px-4 py-3 text-sm text-[#111]">
                  Tell me — is this a recent shift, or has it been chronic? And how many functions does the firefighting touch?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
