'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { downloadVeraBrief } from '@/lib/vera-download';
import type { VeraState } from '@/lib/vera-types';
import VeraAvatar from './VeraAvatar';
const blankLead = { name: '', email: '', company: '', phone: '', consentTerms: false, consentData: false, consentMarketing: false };
const field = 'w-full rounded border border-white/20 bg-[#1a1a1a] px-3 py-2 text-sm text-white';
const button = 'rounded bg-[#991930] px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed';
export default function VeraWorkspace() {
  const [data, setData] = useState<VeraState | null>(null), [input, setInput] = useState(''), [lead, setLead] = useState(blankLead);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const running = useRef(false), generation = useRef(0), startId = useRef<string | null>(null);
  const pending = useRef<{ id: string; conversation: string; message: string } | null>(null);
  const apply = useCallback((next: VeraState) => {
    if (!['account', 'visitor'].includes(next.owner) || !Array.isArray(next.conversations) || !Array.isArray(next.requests)) throw new Error('Invalid conversation response');
    const saved = next.requests.find(item => item.id === pending.current?.id && item.status === 'complete');
    if (saved || (next.state === 'complete' && next.requestId === pending.current?.id)) { pending.current = null; setInput(''); }
    if (!next.conversation) pending.current = null;
    if (next.conversation?.id === startId.current) startId.current = null;
    if (window.location.pathname === '/ai-analyst') {
      const location = new URL(window.location.href);
      if (next.conversation) location.searchParams.set('conversation', next.conversation.id); else location.searchParams.delete('conversation');
      window.history.replaceState(null, '', location.pathname + location.search);
    }
    setData({ ...next, reports: next.reports || [] }); setUnavailable(false);
  }, []);
  const refresh = useCallback(async (id?: string | null) => {
    const ticket = ++generation.current; setLoading(true); setError(''); setNotice('');
    const selected = id === undefined ? new URLSearchParams(window.location.search).get('conversation') : id;
    try {
      const response = await authenticatedFetch('/api/ai-analyst' + (selected ? '?conversationId=' + encodeURIComponent(selected) : ''));
      const next = await response.json();
      if (ticket !== generation.current) return;
      if (!response.ok) throw new Error(next.state === 'expired' ? 'Visitor access expired. Load recent conversations to start a new session.' : next.error || 'Conversation unavailable.');
      apply(next);
      if (next.conversation?.pending) setNotice('An answer is still being prepared. Refresh the conversation to check the saved result.');
    } catch (cause) { if (ticket === generation.current) { setError(cause instanceof Error ? cause.message : 'Conversation unavailable.'); setUnavailable(true); } }
    finally { if (ticket === generation.current) setLoading(false); }
  }, [apply]);
  useEffect(() => {
    void refresh();
    const changed = () => { generation.current++; pending.current = null; startId.current = null; setData(null); setInput(''); setLead(blankLead); void refresh(null); };
    const storage = (event: StorageEvent) => { if (event.key === 'vancore_client_token') changed(); };
    window.addEventListener('vancore:auth-changed', changed); window.addEventListener('storage', storage);
    return () => { generation.current++; window.removeEventListener('vancore:auth-changed', changed); window.removeEventListener('storage', storage); };
  }, [refresh]);
  const action = async (body: object) => {
    if (running.current) return;
    running.current = true; setBusy(true); setError(''); setNotice(''); const ticket = generation.current;
    try {
      const response = await authenticatedFetch('/api/ai-analyst', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const next = await response.json(); if (ticket !== generation.current) return;
      if ((!response.ok && next.state !== 'quota') || typeof next.state !== 'string' || !['complete', 'ready', 'pending', 'quota', 'report_saved'].includes(next.state)) throw new Error(next.error || (response.status === 429 ? 'Please wait a minute before trying again.' : 'The result could not be confirmed.'));
      apply(next);
      if (next.state === 'pending') setNotice('An answer is still being prepared. Refresh before retrying; the same request will not use a second question.');
      if (next.state === 'quota') setNotice('Your plan has no available questions or its validity has ended. Your draft and saved conversation are retained.');
      if (next.state === 'report_saved') setNotice('Preliminary brief saved from this conversation version. ' + (next.owner === 'account' ? 'It is available below and in your account portal.' : 'It is available below in this visitor session.'));
      if (next.state === 'ready') startId.current = null;
    } catch (cause) { if (ticket === generation.current) { setError((cause instanceof TypeError ? 'The connection was interrupted; the result could not be confirmed.' : cause instanceof Error ? cause.message : 'Connection interrupted.') + ' Reload the conversation before retrying. Your draft is retained.'); setUnavailable(true); } }
    finally { running.current = false; setBusy(false); }
  };
  const open = () => {
    startId.current ||= crypto.randomUUID();
    return action({ action: 'open', conversationId: startId.current, ...(data?.owner === 'visitor' ? { lead } : {}) });
  };
  const send = () => {
    if (!data?.conversation || !input.trim() || busy || unavailable || data.conversation.pending || data.quota?.allowed === false) return;
    pending.current ||= { id: crypto.randomUUID(), conversation: data.conversation.id, message: input.trim() };
    return action({ action: 'message', conversationId: pending.current.conversation, requestId: pending.current.id, message: pending.current.message, expectedVersion: data.conversation.version });
  };
  const download = async (id: string) => { try { setError(''); await downloadVeraBrief(id); } catch { setError('The saved brief could not be downloaded. Please retry.'); } };
  const blocked = busy || loading || unavailable;
  return <section aria-label="Vera conversations" className="rounded border border-white/10 bg-[#0a0a0a] p-4 sm:p-6 text-white space-y-5">
    <div className="flex items-center gap-3"><VeraAvatar className="w-9 h-9" /><div><h2 className="font-semibold">Vera AI</h2><p className="text-xs text-[#b5b5b5]">Business analyst · Preliminary guidance</p></div></div>
    {loading && <p role="status">Loading saved conversations…</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-[#dedede]">{notice}</p>}
    <div className="flex gap-3 flex-wrap"><button className={button} disabled={busy || loading} onClick={() => void refresh(data?.conversation?.id || null)}>Reload conversation</button>
      {unavailable && <button className={button} disabled={busy || loading} onClick={() => void refresh(null)}>Load recent conversations</button>}</div>
    {data?.quota && <p className="text-sm">Plan: <strong>{data.quota.plan}</strong> · {data.quota.unlimited ? 'Unlimited conversations' : `${data.quota.remaining ?? 0} questions remaining`}
      {data.quota.validUntil && Number.isFinite(Date.parse(data.quota.validUntil)) && <> · Access valid until {new Date(data.quota.validUntil).toLocaleString()} (your local time)</>}</p>}
    {data?.owner === 'visitor' && <p className="text-xs text-[#b5b5b5]">Visitor history can be reopened in this browser for 30 days. Signing in does not automatically attach an unverified visitor conversation to an account.</p>}
    {!!data?.conversations.length && <div className="space-y-2"><label htmlFor="vera-conversation" className="text-sm">Recent conversations (up to 50)</label><select id="vera-conversation" className={field} value={data.conversation?.id || ''} disabled={blocked || !!input || !!data.conversation?.pending} onChange={event => void refresh(event.target.value)}>
      {data.conversations.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></div>}
    {data && !data.conversation && !loading && (data.owner === 'account' ? <button className={button} disabled={blocked} onClick={() => void open()}>Start conversation</button> : <form className="space-y-3" onSubmit={event => { event.preventDefault(); void open(); }}>
      <p className="text-sm">Share your details to start. Your explicit choices will be saved with this visitor session.</p>
      {(['name', 'email', 'company', 'phone'] as const).map(key => <div key={key}><label htmlFor={'vera-' + key} className="block text-sm capitalize mb-1">{key}{['name', 'email'].includes(key) ? ' *' : ''}</label><input id={'vera-' + key} className={field} type={key === 'email' ? 'email' : 'text'} required={['name', 'email'].includes(key)} maxLength={key === 'email' ? 254 : key === 'name' ? 150 : key === 'company' ? 200 : 80} value={lead[key]} disabled={blocked} onChange={event => setLead(previous => ({ ...previous, [key]: event.target.value }))} /></div>)}
      <label className="flex gap-2 text-sm"><input type="checkbox" required disabled={blocked} checked={lead.consentTerms} onChange={event => setLead(previous => ({ ...previous, consentTerms: event.target.checked }))} /><span>I agree to the <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and have reviewed the <a className="underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" required disabled={blocked} checked={lead.consentData} onChange={event => setLead(previous => ({ ...previous, consentData: event.target.checked }))} />I consent to processing my data for AI business analysis.</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" disabled={blocked} checked={lead.consentMarketing} onChange={event => setLead(previous => ({ ...previous, consentMarketing: event.target.checked }))} />I would like marketing updates (optional).</label>
      <button className={button} disabled={blocked} type="submit">Start conversation</button>
    </form>)}
    {data?.conversation && <>
      <div className="flex gap-3 flex-wrap"><button className={button} disabled={blocked || !!input || !!data.conversation.pending} onClick={() => void open()}>New conversation</button><button className={button} disabled={blocked || !!data.conversation.pending || !data.requests.some(item => item.status === 'complete')} onClick={() => void action({ action: 'report', conversationId: data.conversation?.id })}>Save preliminary brief</button></div>
      {data.hasOlderRequests && <p className="text-sm text-[#b5b5b5]">Showing the most recent 100 requests. Earlier requests remain stored.</p>}
      <div aria-label="Saved conversation" className="space-y-4 max-h-[32rem] overflow-y-auto">
        {!data.requests.length && <p>What specific business problem would you like to explore?</p>}
        {data.requests.map(item => <article key={item.id} className="space-y-2 border-b border-white/10 pb-4"><p className="text-xs text-[#b5b5b5]">You · {new Date(item.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap break-words text-sm">{item.message}</p>
          {item.status === 'complete' ? <><p className="text-xs text-[#b5b5b5]">Vera · {item.mode === 'limited' ? 'Limited response · No question used' : 'Preliminary AI response'}</p><p className="whitespace-pre-wrap break-words text-sm">{item.reply}</p></> : <p className="text-sm text-amber-200">{item.status === 'generating' ? 'Answer pending. Reload to check the saved result.' : 'No completed answer. This request has not used a question.'}</p>}</article>)}
      </div>
      <form className="space-y-2" onSubmit={event => { event.preventDefault(); void send(); }}><label htmlFor="vera-chat-input" className="block text-sm">Your message</label><textarea id="vera-chat-input" className={field} maxLength={6000} rows={3} value={input} readOnly={!!pending.current || busy} disabled={loading} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} />
        <div className="flex gap-3 flex-wrap"><button className={button} type="submit" disabled={blocked || !input.trim() || !!data.conversation.pending || data.quota?.allowed === false}>{busy ? 'Saving…' : pending.current ? 'Retry same message' : 'Send'}</button>
          {!!input && !busy && <button className="text-sm underline" type="button" onClick={() => { setInput(''); pending.current = null; }}>Discard draft (saved requests remain)</button>}</div></form>
    </>}
    {data?.quota?.allowed === false && <div className="text-sm space-y-2"><p>Enquire about a plan; the team activates it after agreement.</p><div className="flex gap-4 flex-wrap"><a className="underline" href="/contact?plan=payg">PAYG €25 · 500 questions / 3 months</a><a className="underline" href="/contact?plan=professional">Professional €49/month</a><a className="underline" href="/contact?plan=business">Business €99/month</a></div></div>}
    {!!data?.reports.length && <div className="space-y-2"><h3 className="font-semibold">Recent saved briefs (up to 50)</h3><p className="text-xs text-[#b5b5b5]">Conversation snapshots, not independently verified or human-reviewed reports.</p>{data.reports.map(report => <div className="flex justify-between gap-3 border-t border-white/10 pt-2 text-sm" key={report.id}><span>{report.title} · version {report.version}</span><button className="underline" disabled={busy} onClick={() => void download(report.id)}>Download brief</button></div>)}</div>}
  </section>;
}
