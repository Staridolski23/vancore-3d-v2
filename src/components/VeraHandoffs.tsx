'use client';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import VeraAnalysisView, { type SavedAnalysis, type ConsultantReview } from './VeraAnalysisView';
type Handoff = { id: string; analysis_id: string; title?: string; client_name?: string; client_company?: string; client_message: string; assigned_to: string | null; status: string; version: number };
type Detail = { handoff: Handoff; analysis: SavedAnalysis; reviews: ConsultantReview[] };
const button = 'rounded border border-white/25 px-3 py-2 text-sm disabled:opacity-50';
export default function VeraHandoffs() {
  const [items, setItems] = useState<Handoff[]>([]), [staff, setStaff] = useState<{ id: string; name: string }[]>([]), [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true), [unavailable, setUnavailable] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [review, setReview] = useState(''), [assignee, setAssignee] = useState('');
  const alive = useRef(true), epoch = useRef(0), running = useRef(false), dirty = useRef(false);
  const clearPrivate = () => { setItems([]); setStaff([]); setDetail(null); setReview(''); setNotice(''); dirty.current = false; setUnavailable(true); };
  const load = async () => {
    const ticket = ++epoch.current; setLoading(true); setError('');
    try { const response = await authenticatedFetch('/api/vera-handoffs'), data = await response.json(); if ([401, 403].includes(response.status) && alive.current && ticket === epoch.current) clearPrivate(); if (!response.ok || !Array.isArray(data.items)) throw new Error(data.error || 'Review queue unavailable.'); if (alive.current && ticket === epoch.current) { setItems(data.items); setStaff(data.staff || []); setUnavailable(false); } }
    catch (cause) { if (alive.current && ticket === epoch.current) { setUnavailable(true); setError(cause instanceof Error ? cause.message : 'Review queue unavailable. Previously loaded items are retained.'); } }
    finally { if (alive.current && ticket === epoch.current) setLoading(false); }
  };
  useEffect(() => { alive.current = true; void load(); const changed = () => { epoch.current++; clearPrivate(); void load(); }; const storage = (event: StorageEvent) => { if (event.key === 'vancore_client_token') changed(); }; window.addEventListener('vancore:auth-changed', changed); window.addEventListener('storage', storage); return () => { alive.current = false; epoch.current++; window.removeEventListener('vancore:auth-changed', changed); window.removeEventListener('storage', storage); }; }, []);
  const open = async (id: string, preserveDraft = false) => {
    if (running.current || (dirty.current && !preserveDraft)) return; const ticket = ++epoch.current; setLoading(true); setError(''); if (!preserveDraft) setDetail(null);
    try { const response = await authenticatedFetch('/api/vera-handoffs?id=' + encodeURIComponent(id)), data = await response.json(); if ([401, 403, 404].includes(response.status) && alive.current && ticket === epoch.current) clearPrivate(); if (!response.ok || !data.analysis || !data.handoff) throw new Error(data.error || 'Case unavailable.'); if (alive.current && ticket === epoch.current) { setDetail(data); setAssignee(data.handoff.assigned_to || staff[0]?.id || ''); if (!preserveDraft) setReview(''); setUnavailable(false); } }
    catch (cause) { if (alive.current && ticket === epoch.current) { setUnavailable(true); setError(cause instanceof Error ? cause.message : 'Case unavailable.'); } }
    finally { if (alive.current && ticket === epoch.current) setLoading(false); }
  };
  const save = async (action: string, input: object) => {
    if (!detail || running.current || unavailable || loading) return; running.current = true; setBusy(true); setError(''); setNotice(''); const ticket = epoch.current;
    try { const response = await authenticatedFetch('/api/vera-handoffs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: detail.handoff.id, action, expectedVersion: detail.handoff.version, ...input }) }), data = await response.json(); if (!response.ok || data.saved !== true || !data.handoff) throw new Error(data.error || 'Result not confirmed.'); if (alive.current && ticket === epoch.current) { setDetail(previous => previous ? { ...previous, handoff: data.handoff } : null); setItems(previous => previous.map(item => item.id === data.handoff.id ? { ...item, ...data.handoff } : item)); if (action === 'review') { setReview(''); dirty.current = false; setNotice('Consultant review published to the client. Reload the case to see the saved review.'); } else setNotice('Handoff change saved.'); } }
    catch (cause) { if (alive.current && ticket === epoch.current) { setUnavailable(true); setError((cause instanceof Error ? cause.message : 'Connection interrupted.') + ' Reload before retrying. Your review draft is retained.'); } }
    finally { running.current = false; if (alive.current) setBusy(false); }
  };
  return <section className="text-white space-y-4"><h2 className="text-xl font-semibold">Vera consultant reviews</h2><p className="text-sm text-[#b5b5b5]">Only reports explicitly shared by clients appear here. Administrators manage the queue; consultants see assigned requests. Up to 100 recent requests.</p>
    {loading && <p role="status">Loading…</p>}{error && <p role="alert" className="text-red-300">{error}</p>}{notice && <p role="status">{notice}</p>}
    <button className={button} disabled={loading || busy || dirty.current} onClick={() => void load()}>Refresh review queue</button>{detail && <button className={button} disabled={loading || busy} onClick={() => void open(detail.handoff.id, true)}>Reload current case (keep review draft)</button>}{dirty.current && <button className={button} disabled={busy} onClick={() => { setReview(''); dirty.current = false; }}>Discard review draft</button>}
    {!loading && !unavailable && !items.length && <p>No shared assessments assigned to this account.</p>}
    <div className="space-y-2">{items.map(item => <div className="border border-white/15 rounded p-3" key={item.id}><p>{item.title} · {item.status.replaceAll('_', ' ')}</p><p className="text-sm text-[#b5b5b5]">{item.client_name} · {item.client_company}</p><button className="underline text-sm" disabled={loading || busy || dirty.current || item.status === 'cancelled'} onClick={() => void open(item.id)}>Open shared assessment</button></div>)}</div>
    {detail && <div className="space-y-4"><p className="whitespace-pre-wrap">Client message: {detail.handoff.client_message}</p>{detail.analysis.content.legalResearch && <p className="text-amber-200 text-sm">This case includes legal research. This queue does not verify lawyer qualifications; a business consultant review must not be represented as qualified legal approval.</p>}<VeraAnalysisView analysis={detail.analysis} reviews={detail.reviews} />
      {!['completed', 'cancelled'].includes(detail.handoff.status) && <div className="space-y-3">
        {!!staff.length && <div className="flex flex-wrap gap-3"><label>Assign to<select className="bg-[#111] border border-white/20 p-2 ml-2" value={assignee} disabled={busy || unavailable} onChange={event => setAssignee(event.target.value)}>{staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className={button} disabled={busy || unavailable || !assignee} onClick={() => void save('assign', { assignee })}>Save assignment</button></div>}
        <div className="flex gap-3"><button className={button} disabled={busy || unavailable} onClick={() => void save('status', { status: 'in_review' })}>Mark in review</button></div>
        <label className="block">Consultant review<textarea className="w-full bg-[#111] border border-white/20 p-3 mt-2" rows={7} minLength={40} maxLength={12000} value={review} disabled={busy} onChange={event => { setReview(event.target.value); dirty.current = !!event.target.value; }} /></label><p className="text-xs text-[#b5b5b5]">Publishing saves your own review separately from the immutable AI draft and makes it visible to the client. No email is sent.</p>
        <button className={button} disabled={busy || unavailable || review.trim().length < 40} onClick={() => void save('review', { body: review })}>Publish consultant review to client</button>
      </div>}
    </div>}
  </section>;
}
