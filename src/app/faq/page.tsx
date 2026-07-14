import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FAQ | VANCORE',
  description: 'Answers to common questions about VANCORE engagements, methodology, timelines, industries, pricing, and how we work with clients.',
  openGraph: {
    title: 'FAQ | VANCORE',
    description: 'Answers to common questions about VANCORE engagements, methodology, timelines, industries, pricing, and how we work with clients.',
    url: 'https://www.vancoresys.com/faq',
    type: 'website',
  },
  alternates: { canonical: '/faq' },
};

const faqs = [
  {
    q: 'What does VANCORE actually do?',
    a: 'We help companies see clearly through their internal complexity — and act on what they find. We focus on business analysis, process re-engineering, AI-powered diagnostics, and change enablement so your team can fix root causes, not symptoms.',
  },
  {
    q: 'How is this different from traditional consulting?',
    a: 'Big consultancies often leave behind slide decks and dependencies. We stay small, co-build with your people, and stay until the changes stick. No junior staff rotation, no 40-question surveys that lead nowhere.',
  },
  {
    q: 'What happens in the Discovery phase?',
    a: 'Discovery is usually two weeks. We interview stakeholders, shadow operations, review key documents, and surface where the real friction is before recommending anything.',
  },
  {
    q: 'Do you only work with large companies?',
    a: 'No. We primarily serve mid-market and business operators who have enough complexity to matter, but not so much that they need a 40-person project team. Our sweet spot is growing companies in HoReCa, e-commerce, logistics, and technology.',
  },
  {
    q: 'How quickly can we see results?',
    a: 'Most teams notice clearer signals within the first two weeks. Tangible operational changes usually start within one to two months, depending on scope and adoption speed.',
  },
  {
    q: 'What does pricing look like?',
    a: 'Every engagement is different, but most engagements start in the five-figure range. We discuss scope, context, and timeline before proposing a structure — no opaque bills or open-ended retainers unless you want them.',
  },
  {
    q: 'Do you work remotely or on-site?',
    a: 'Both. We usually start remotely for interviews and data review, then spend time on-site where it matters most — in the operations themselves.',
  },
  {
    q: 'How does the AI Analyst / Vera fit in?',
    a: 'Vera is a diagnostic layer that helps surface problems faster. It does not replace judgment. Our role is to interpret the output, connect it to what your people are already saying, and turn it into action.',
  },
  {
    q: 'What information do you need from us?',
    a: 'Access, honesty, and a contact person. In practice that means sharing systems or samples for review, letting us observe real work, and giving us candid answers — not polished ones.',
  },
  {
    q: 'What if we are not the right fit?',
    a: 'We will tell you. We would rather redirect you early than run a project where neither side wins. If we can help, we will say so clearly — and if we cannot, we will say that too.',
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-6">
            — FAQ
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-[#111] leading-[1.08] mb-4 max-w-3xl">
            Frequently asked questions.
          </h1>
          <p className="font-sans text-base md:text-lg text-[#6b6b6b] leading-relaxed max-w-2xl mb-12">
            Straight answers to the questions we get most often. If yours is missing, reach out directly and we will respond within one business day.
          </p>
          <div className="max-w-3xl divide-y divide-[#e5e5e5]">
            {faqs.map((item, i) => (
              <div key={i} className="py-8">
                <h2 className="font-display text-xl md:text-2xl text-[#111] mb-3">{item.q}</h2>
                <p className="font-sans text-sm md:text-[15px] text-[#6b6b6b] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-[#e5e5e5] pt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div>
                <h3 className="font-display text-2xl md:text-3xl text-[#111] mb-3">Still have a question?</h3>
                <p className="text-sm text-[#6b6b6b] leading-relaxed">
                  We reply within one business day. If we are not the right fit, we will say so early.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e5e5e5] p-6 md:p-8">
                <form
                  className="space-y-3 text-sm"
                  action="mailto:hello@vancoresys.com"
                >
                  <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border border-[#e5e5e5] rounded-sm px-3 py-2.5 text-sm placeholder:text-[#9a9a9a] focus:outline-none focus:border-[#991930]/50"
                    placeholder="Your name"
                  />
                  <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-white border border-[#e5e5e5] rounded-sm px-3 py-2.5 text-sm placeholder:text-[#9a9a9a] focus:outline-none focus:border-[#991930]/50"
                    placeholder="you@company.com"
                  />
                  <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Question</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-white border border-[#e5e5e5] rounded-sm px-3 py-2.5 text-sm placeholder:text-[#9a9a9a] focus:outline-none focus:border-[#991930]/50"
                    placeholder="What would you like to know?"
                  ></textarea>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#991930] text-white text-sm font-medium rounded-sm hover:bg-[#a83d1f] transition-colors"
                  >
                    Ask your question
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
