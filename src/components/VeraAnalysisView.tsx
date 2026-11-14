import type { AnalysisDraft } from '@/lib/vera-analysis';
export type SavedAnalysis = { id: string; source_version: number; created_at: string; model: string | null; notes_snapshot: string; content: AnalysisDraft };
export type ConsultantReview = { id: string; body: string; created_at: string };
export default function VeraAnalysisView({ analysis, reviews = [] }: { analysis: SavedAnalysis; reviews?: ConsultantReview[] }) {
  const report = analysis.content;
  return <article className="space-y-4 border border-white/20 rounded p-4 text-sm text-white break-words">
    <header><p className="text-amber-200 font-semibold">{reviews.length ? 'Original AI draft · Separate consultant review below' : 'AI draft · Not a consultant-approved report'}</p><h3 className="font-semibold text-lg">{report.title}</h3><p className="text-xs text-[#b5b5b5]">Saved {new Date(analysis.created_at).toLocaleString()} · Source version {analysis.source_version}</p></header>
    <p>User statements are unverified. Proposed benefits, roles, targets and timings require validation and agreement. This assessment uses selected case evidence.</p>
    <section><h4 className="font-semibold">Executive summary</h4><p className="whitespace-pre-wrap">{report.summary}</p></section>
    <section><h4 className="font-semibold">Client-reported evidence</h4>{report.facts.map((fact, index) => <blockquote className="border-l-2 border-white/30 pl-3 my-2" key={index}><p className="whitespace-pre-wrap">{fact.quote}</p><p className="text-xs text-[#b5b5b5]">Source: {fact.sourceRequestId}</p></blockquote>)}</section>
    {([['Missing information', report.unknowns], ['Hypotheses to validate', report.hypotheses], ['Risks', report.risks], ['Follow-up questions', report.questions]] as const).map(([title, items]) => <section key={title}><h4 className="font-semibold">{title}</h4><ul className="list-disc pl-5">{items.map((item, index) => <li className="whitespace-pre-wrap" key={index}>{item}</li>)}</ul></section>)}
    <section><h4 className="font-semibold">Proposed action plan</h4>{report.actions.map((item, index) => <div className="border-t border-white/10 py-2" key={index}><p>{item.priority}: {item.action}</p><p className="text-xs text-[#b5b5b5]">Suggested owner: {item.ownerRole} · Indicator: {item.metric} · Proposed timing: {item.timeframe}</p></div>)}</section>
    {!!analysis.notes_snapshot && <section><h4 className="font-semibold">Client notes at generation time</h4><p className="whitespace-pre-wrap">{analysis.notes_snapshot}</p></section>}
    {reviews.map(review => <section className="border-t border-emerald-400/40 pt-3" key={review.id}><h4 className="font-semibold text-emerald-200">VANCORE consultant review · {new Date(review.created_at).toLocaleString()}</h4><p className="whitespace-pre-wrap">{review.body}</p></section>)}
  </article>;
}
