'use client';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { downloadVeraBrief } from '@/lib/vera-download';
import type { VeraState } from '@/lib/vera-types';
import VeraAnalysisView, { type SavedAnalysis, type ConsultantReview } from './VeraAnalysisView';
const button = 'rounded border border-white/25 px-3 py-2 text-sm disabled:opacity-50';
const field = 'w-full rounded border border-white/20 bg-[#1a1a1a] p-3 text-sm text-white';
type Props = { data: VeraState; blocked: boolean; draftBlocked: boolean; analysisPending: boolean; act: (body: object) => Promise<void>; generate: () => void; discardAnalysis: () => void; onDirty: (value: boolean) => void };
export default function VeraCaseTools({ data, blocked, draftBlocked, analysisPending, act, generate, discardAnalysis, onDirty }: Props) {
  const [notes, setNotes] = useState(data.caseNotes || ''), [dirty, setDirty] = useState(false), [selected, setSelected] = useState(''), [message, setMessage] = useState(''), [share, setShare] = useState(false);
  const [view, setView] = useState<{ analysis: SavedAnalysis; reviews: ConsultantReview[] } | null>(null), [error, setError] = useState(''), [reading, setReading] = useState(false);
  const revision = useRef(0), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; revision.current++; }; }, []);
  useEffect(() => { if (notes === (data.caseNotes || '')) { setDirty(false); onDirty(false); } else if (!dirty) setNotes(data.caseNotes || ''); }, [data.caseNotes, notes, dirty, onDirty]);
  const analyses = data.analyses || [], chosen = analyses.some(item => item.id === selected) ? selected : analyses[0]?.id || '';
  const shared = data.handoffs?.find(item => item.analysis_id === chosen);
  useEffect(() => { setShare(false); }, [chosen, shared?.status]);
  const read = async (id: string) => {
    const ticket = ++revision.current; setReading(true); setError(''); setView(null);
    try { const response = await authenticatedFetch('/api/ai-analyst?analysisId=' + encodeURIComponent(id)), result = await response.json(); if (!response.ok || result.state !== 'analysis') throw new Error(); if (alive.current && ticket === revision.current) setView({ analysis: result.analysis, reviews: result.reviews || [] }); }
    catch { if (alive.current && ticket === revision.current) setError('The saved assessment could not be loaded. Please retry.'); }
    finally { if (alive.current && ticket === revision.current) setReading(false); }
  };
  const download = async (id: string) => { try { setError(''); await downloadVeraBrief(id, true); } catch { if (alive.current) setError('The assessment could not be downloaded. Please retry.'); } };
  return <div className="space-y-6 border-t border-white/15 pt-5">
    <section className="space-y-2"><h3 className="font-semibold">Case facts and goals</h3><p className="text-xs text-[#b5b5b5]">Keep essential figures, goals, constraints and corrections here. Vera uses these unverified notes and relevant older statements from this case. Save changes before sending another question.</p>
      <label htmlFor="vera-case-notes" className="block text-sm">Your case notes</label><textarea id="vera-case-notes" rows={4} maxLength={6000} className={field} value={notes} disabled={blocked} onChange={event => { setNotes(event.target.value); const changed = event.target.value !== (data.caseNotes || ''); setDirty(changed); onDirty(changed); }} />
      <button className={button} disabled={blocked || !dirty || draftBlocked || !!data.conversation?.pending} onClick={() => void act({ action: 'memory', conversationId: data.conversation?.id, notes, expectedVersion: data.conversation?.version })}>Save case notes</button>{dirty && <span className="text-xs text-amber-200 ml-3">Unsaved notes</span>}
    </section>
    <section className="space-y-3"><h3 className="font-semibold">Structured assessment</h3><p className="text-xs text-[#b5b5b5]">Generate an AI draft with evidence, missing information, hypotheses, risks and proposed actions. This is an AI question under your plan. Failed or limited generation does not use a question. Consultant review is separate.</p>
      <button className={button} disabled={blocked || dirty || draftBlocked || !!data.conversation?.pending || data.quota?.allowed === false || !data.requests.some(item => item.status === 'complete')} onClick={generate}>{analysisPending ? 'Retry the same report request' : data.quota?.unlimited ? 'Generate AI assessment' : 'Generate AI assessment · 1 question'}</button>
      {analysisPending && !blocked && !data.conversation?.pending && <button className="text-sm underline ml-3" onClick={discardAnalysis}>Discard report retry</button>}
      {!!analyses.length && <p className="text-xs text-[#b5b5b5]">Up to 20 recent saved assessments. Source versions stay fixed.</p>}
      {analyses.map(item => <div className="border-t border-white/10 py-2 text-sm space-y-1" key={item.id}><p>{item.title} · source version {item.source_version}</p><div className="flex gap-4"><button className="underline" disabled={reading || blocked} onClick={() => void read(item.id)}>View assessment</button><button className="underline" disabled={blocked} onClick={() => void download(item.id)}>Download assessment</button></div></div>)}
      {reading && <p role="status">Loading saved assessment…</p>}{error && <p role="alert" className="text-red-300 text-sm">{error}</p>}{view && <VeraAnalysisView {...view} />}
    </section>
    {!!analyses.length && <section className="space-y-3"><h3 className="font-semibold">Request a consultant review</h3><p className="text-xs text-[#b5b5b5]">Share only the selected saved assessment, quoted evidence, case-note snapshot and this message with VANCORE. Other conversations are not shared. This enters a review queue and does not confirm an appointment or email delivery.</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void act({ action: 'handoff', conversationId: data.conversation?.id, analysisId: chosen, message, shareWithTeam: share, ...(shared?.status === 'cancelled' ? { expectedVersion: shared.version } : {}) }); }}>
        <label className="block text-sm">Assessment to share<select className={field} value={chosen} disabled={blocked} onChange={event => setSelected(event.target.value)}>{analyses.map(item => <option key={item.id} value={item.id}>{item.title} · version {item.source_version}</option>)}</select></label>
        <label className="block text-sm">Message for the consultant<textarea className={field} rows={3} value={message} maxLength={2000} disabled={blocked} onChange={event => setMessage(event.target.value)} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={share} required disabled={blocked} onChange={event => setShare(event.target.checked)} />I choose to share this assessment and the information described above with VANCORE for consultant review.</label>
        {shared && <p className="text-xs text-[#b5b5b5]">This assessment's review request: {shared.status.replaceAll('_', ' ')}.</p>}
        <button className={button} disabled={blocked || !share || !chosen || (!!shared && shared.status !== 'cancelled')}>{shared?.status === 'cancelled' ? 'Share this assessment again' : 'Send review request'}</button>
      </form>
    </section>}
    {!!data.handoffs?.length && <section className="space-y-2"><h3 className="font-semibold">Your review requests</h3>{data.handoffs.map(item => <div className="text-sm border-t border-white/10 py-2" key={item.id}><p>Status: {item.status.replaceAll('_', ' ')} · {new Date(item.created_at).toLocaleString()}</p>{!['completed', 'cancelled'].includes(item.status) && <button className="underline" disabled={blocked} onClick={() => void act({ action: 'cancel_handoff', conversationId: data.conversation?.id, handoffId: item.id, expectedVersion: item.version })}>Withdraw review request</button>}</div>)}</section>}
  </div>;
}
