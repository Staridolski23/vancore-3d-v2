import Header from '@/components/Header';
import Link from 'next/link';

const articles = [
  {
    slug: 'when-to-bring-in-a-business-analyst',
    title: 'When to bring in a business analyst',
    date: '2026-04-18',
    readTime: '6 min',
    excerpt: 'Most operational problems are diagnosable without another tool. They just need someone to ask the right follow-up questions.',
    tags: ['Business Analysis', 'Operations'],
  },
  {
    slug: 'the-hidden-cost-of-process-theater',
    title: 'The hidden cost of process theater',
    date: '2026-03-07',
    readTime: '5 min',
    excerpt: 'Documentation is valuable. Documentation as theater — when processes exist on paper but not in practice — is expensive.',
    tags: ['Process', 'Change Enablement'],
  },
  {
    slug: 'ai-in-diagnostics-not-dreams',
    title: 'AI in diagnostics, not dreams',
    date: '2026-02-21',
    readTime: '7 min',
    excerpt: 'We use AI to surface what teams miss — not to automate decisions. The value is in the context, not the model.',
    tags: ['AI', 'Diagnostics'],
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — INSIGHTS
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#111] leading-[1.08] mb-6 max-w-3xl">
            From the workshop, not the keynote stage.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl">
            Practical notes on business analysis, process change, responsible AI, and everything we learning working inside companies — not advising from a distance.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="border border-[#e5e5e5] rounded-sm p-6 md:p-8 hover:border-[#991930]/40 transition-colors group"
              >
                <div className="flex items-center gap-3 text-xs text-[#6b6b6b] mb-4">
                  <span className="text-[#991930] font-sans font-semibold tracking-[0.18em] uppercase">
                    {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[#e5e5e5]">/</span>
                  <span>{article.readTime} read</span>
                </div>
                <h3 className="font-display text-xl md:text-2xl text-[#111] mb-3 group-hover:text-[#991930] transition-colors">
                  {article.title}
                </h3>
                <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed mb-5">
                  {article.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-sans text-[#6b6b6b] border border-[#e5e5e5] rounded-full px-2.5 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
