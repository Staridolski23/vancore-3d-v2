'use client';
import VeraChat from '@/components/VeraChat';

export default function AIAnalystPage() {
  return (
    <div className="min-h-screen bg-white border-t border-[#e5e5e5]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-5">— AI ANALYST</div>
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-6">Chat with Vera.</h1>
        <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed mb-8">
          Describe your case. Vera will ask a few sharp questions and prepare a brief for our team.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          <div className="rounded-sm border border-[#e5e5e5] p-5">
            <div className="text-[#111] font-display text-xl mb-1">3–5 questions</div>
            <div className="text-xs text-[#6b6b6b] tracking-wide uppercase">Assessment scope</div>
          </div>
          <div className="rounded-sm border border-[#e5e5e5] p-5">
            <div className="text-[#111] font-display text-xl mb-1">24–48 hours</div>
            <div className="text-xs text-[#6b6b6b] tracking-wide uppercase">Typical response</div>
          </div>
          <div className="rounded-sm border border-[#e5e5e5] p-5">
            <div className="text-[#111] font-display text-xl mb-1">Ready for review</div>
            <div className="text-xs text-[#6b6b6b] tracking-wide uppercase">Next step</div>
          </div>
        </div>

        <VeraChat />
      </div>
    </div>
  );
}
