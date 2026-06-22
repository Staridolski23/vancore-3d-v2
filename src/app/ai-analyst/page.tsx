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
        <VeraChat />
      </div>
    </div>
  );
}
