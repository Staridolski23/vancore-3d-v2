'use client';

import Header from '@/components/Header';
import Link from 'next/link';

const articles = {
  'when-to-bring-in-a-business-analyst': {
    title: 'When to bring in a business analyst',
    date: '2026-04-18',
    readTime: '6 min',
    tags: ['Business Analysis', 'Operations'],
    body: (
      <>
        <p className="mb-5">
          Most operational problems feel like tool problems. The client wants dashboards, more visibility, better software. The real issue usually sits lower: unclear ownership, a broken handoff, or a metric nobody actually owns.
        </p>
        <p className="mb-5">
          A business analyst doesn&apos;t start with software recommendations. They start with the work itself: how it moves, where it stops, and who makes those decisions.
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-[#111] mt-10 mb-4">Signs you actually need one</h2>
        <p className="mb-5">
          You can&apos;t answer these without guessing: how long does the average task take from request to delivery, who approves it, and what happens if it fails. Those are analyst questions, not tool questions.
        </p>
        <p className="mb-5">
          The wrong signal is when a team asks for a bigger system instead of a clearer process. Bigger systems can automate confusion — they won&apos;t remove it.
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-[#111] mt-10 mb-4">What to expect</h2>
        <p className="mb-5">
          A short engagement. Discovery first, no deliverables for the sake of deliverables. A report that names the broken parts and proposes a path forward. Then the work.
        </p>
        <p>
          If you&apos;re unsure, a conversation costs nothing. Reach out and we&apos;ll tell you honestly whether engagement makes sense — or whether you should sort it internally first.
        </p>
      </>
    ),
  },
  'the-hidden-cost-of-process-theater': {
    title: 'The hidden cost of process theater',
    date: '2026-03-07',
    readTime: '5 min',
    tags: ['Process', 'Change Enablement'],
    body: (
      <>
        <p className="mb-5">
          A 40-page operations manual is impressive on a shelf. It&apos;s less impressive if the team hasn&apos;t read it, ignores it, or updates it once per year.
        </p>
        <p className="mb-5">
          Process theater is when documentation becomes the goal instead of the tool. The result: meetings about the manual, training about the manual, audits around the manual — while the actual process keeps running in the background the same way it always did.
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-[#111] mt-10 mb-4">What actually changes behavior</h2>
        <p className="mb-5">
          Ownership, simplicity, and repetition. A one-page flow that the team actually uses beats a hundred-page PDF.
        </p>
        <p className="mb-5">
          We always ask: will this be followed in six months without an audit? If yes, it&apos;s real process change. If no, it&apos;s process theater.
        </p>
        <p>
          The cost of theater isn&apos;t just inefficiency. It&apos;s missed trust. When leadership pushes process that nobody follows, teams stop listening to real change — and that&apos;s harder to fix than any workflow.
        </p>
      </>
    ),
  },
  'ai-in-diagnostics-not-dreams': {
    title: 'AI in diagnostics, not dreams',
    date: '2026-02-21',
    readTime: '7 min',
    tags: ['AI', 'Diagnostics'],
    body: (
      <>
        <p className="mb-5">
          We built our proprietary diagnostic analyzer to do what human consultants do well, but slowly: scan financial, tax, HR, operations, legal, and marketing data and surface anomalies, gaps, and risks.
        </p>
        <p className="mb-5">
          AI is dangerous when it&apos;s used to replace judgment. It&apos;s useful when it&apos;s used to surface what teams miss in busy environments.
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-[#111] mt-10 mb-4">What we mean by diagnostics</h2>
        <p className="mb-5">
          Inputs: real documents and data. Output: a map of where the problem might be. A human then checks, contextualizes, and decides whether the signal is real.
        </p>
        <p className="mb-5">
          People are the fallible part of any process. AI should compensate for human blind spots, not replace the operator.
        </p>
        <p>
          If an AI system tells you everything is fine and nobody questions it, it&apos;s not helping. The goal is always sharper questions — not fewer decisions.
        </p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const article = articles[params.slug];

  if (!article) {
    return (
      <main className="min-h-screen bg-white text-[#111]">
        <Header />
        <section className="pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#991930] mb-8">
              ← Back to insights
            </Link>
            <h1 className="font-display text-4xl md:text-6xl text-[#111] leading-[1.08] mb-6">
              Article not found
            </h1>
            <p className="font-sans text-base text-[#6b6b6b] leading-relaxed max-w-2xl">
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

      <article className="pt-28 pb-16 md:pt-36 md:pb-24 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#991930] mb-8">
            ← Back to insights
          </Link>
          <div className="flex items-center gap-3 text-xs text-[#6b6b6b] mb-5">
            <span className="text-[#991930] font-sans font-semibold tracking-[0.18em] uppercase">
              {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[#e5e5e5]">/</span>
            <span>{article.readTime} read</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            {article.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-sans text-[#6b6b6b] border border-[#e5e5e5] rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed">
            {article.body}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#f7f6f2] border-t border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-[#111] mb-4">Rather talk about it?</h2>
          <p className="font-sans text-sm text-[#6b6b6b] mb-8 max-w-md mx-auto">
            Book a short call and we&apos;ll tell you honestly whether we can help.
          </p>
          <Link href="/book-call" className="inline-flex items-center gap-2 px-6 py-3 bg-[#991930] text-white text-sm font-sans font-medium btn-hover">
            Book a call
          </Link>
        </div>
      </section>
    </main>
  );
}
