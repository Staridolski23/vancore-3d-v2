'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import type { AdminClient, AccountAudit } from '@/lib/account-types';

export default function AdminClientEditor({ client, token, onUpdated, onClose, onBookMeeting }: {
  client: AdminClient; token?: string; onUpdated: (client: AdminClient) => void; onClose: () => void; onBookMeeting: () => void;
}) {
  const [plan, setPlan] = useState(client.plan || 'starter');
  const [status, setStatus] = useState(client.subscription_status || 'free');
  const [role, setRole] = useState(client.role || 'client');
  const [credits, setCredits] = useState(String(client.credits ?? 0));
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState('');
  const [audit, setAudit] = useState<AccountAudit[]>([]);
  const [auditError, setAuditError] = useState('');
  const [auditLoading, setAuditLoading] = useState(true);
  const auditGeneration = useRef(0);
  const headers = useCallback((): Record<string, string> => token ? { Authorization: 'Bearer ' + token } : {}, [token]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const loadAudit = useCallback(async () => {
    const generation = ++auditGeneration.current;
    setAuditLoading(true); setAuditError('');
    try {
      const response = await authenticatedFetch('/api/adminv2/clients/' + encodeURIComponent(client.id), { headers: headers() });
      if (!response.ok) throw new Error();
      const data = await response.json(); if (!Array.isArray(data.audit)) throw new Error();
      if (auditGeneration.current === generation) setAudit(data.audit);
    } catch { if (auditGeneration.current === generation) setAuditError('Change history could not be loaded. Please retry.'); }
    finally { if (auditGeneration.current === generation) setAuditLoading(false); }
  }, [client.id, headers]);
  useEffect(() => { void loadAudit(); return () => { auditGeneration.current++; }; }, [loadAudit]);

  const save = async (change: Record<string, string | number | boolean>) => {
    if (running.current) return false;
    running.current = true; setBusy(true); setMessage('');
    try {
      const response = await authenticatedFetch('/api/adminv2/clients/' + encodeURIComponent(client.id), {
        method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...change, expectedUpdatedAt: client.updated_at ?? null, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(response.status === 409 ? 'This account changed. Reload the account before trying again; your draft is still here.' : data.error || 'The change was not saved. Your draft is still here.');
        return false;
      }
      if (data.success !== true || data.client?.id !== client.id) throw new Error();
      onUpdated({ ...client, ...data.client });
      if ('plan' in change) setPlan(data.client.plan);
      if ('subscription_status' in change) setStatus(data.client.subscription_status);
      if ('role' in change) setRole(data.client.role);
      if ('credits' in change || 'creditDelta' in change) setCredits(String(data.client.credits));
      setMessage('Change saved.'); setNote('');
      void loadAudit(); return true;
    } catch { setMessage('The result could not be confirmed. Reload the account before submitting again. Your draft is still here.'); return false; }
    finally { running.current = false; setBusy(false); }
  };
  const reload = async () => {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      const response = await authenticatedFetch('/api/adminv2/clients', { headers: headers() });
      if (!response.ok) throw new Error();
      const data = await response.json(); const current = Array.isArray(data.clients) ? data.clients.find((item: AdminClient) => item.id === client.id) : null;
      if (!current) throw new Error();
      onUpdated(current); setMessage('Account reloaded. Review your draft against the saved values before saving.'); void loadAudit();
    } catch { setMessage('The account could not be reloaded. Your draft is still here.'); }
    finally { running.current = false; setBusy(false); }
  };
  const saveCredits = () => {
    const amount = Number(credits);
    if (!credits.trim() || !Number.isInteger(amount) || amount < 0 || amount > 2147483647) { setMessage('Enter a whole credit total from 0 to 2,147,483,647.'); return; }
    void save({ credits: amount });
  };
  const addCredits = async () => {
    const amount = Number(delta);
    if (!delta.trim() || !Number.isInteger(amount) || amount <= 0 || amount > 2147483647) { setMessage('Enter a positive whole number of credits to add.'); return; }
    if (await save({ creditDelta: amount })) setDelta('');
  };
  const fieldClass = 'w-full bg-[#1a1a1a] border border-white/20 rounded px-3 py-2 text-sm text-white disabled:opacity-50';
  const buttonClass = 'px-3 py-2 rounded bg-[#991930] text-white text-sm disabled:opacity-50';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email);
  return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-client-title" className="bg-[#111] border border-white/10 rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-5 text-white space-y-5" onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="flex justify-between gap-4"><div><h2 id="admin-client-title" className="text-lg font-semibold">{client.name || client.email}</h2><p className="text-sm text-[#b7b7b7] break-all">{client.email}</p></div><button ref={closeButton} disabled={busy} onClick={onClose} aria-label="Close client editor" className="p-2">✕</button></div>
      <p className="text-sm text-[#b7b7b7]">Saved: {client.plan || 'Unknown plan'} · {client.subscription_status || 'Unknown status'} · {client.credits ?? 'Unknown'} credits · {client.role || 'Unknown role'}</p>
      {(message || busy) && <p role="status" className="text-sm text-amber-200">{busy ? 'Saving or loading account…' : message}</p>}
      <button disabled={busy} onClick={reload} className="px-3 py-2 border border-white/20 rounded text-sm disabled:opacity-50">Reload account</button>
      {client.plan === 'payg' && <div className="space-y-2 text-sm"><p>PAYG valid until: {client.subscription_end && Number.isFinite(Date.parse(client.subscription_end)) ? new Date(client.subscription_end).toLocaleString() : 'Not activated with a valid expiry'}</p><p>Renew an expired or exhausted allocation after agreement: 500 questions for 3 months. Valid unused questions are not overwritten by early renewal.</p><button disabled={busy} className={buttonClass} onClick={() => save({ plan: 'payg', subscription_status: 'active', renewPayg: true })}>Renew expired or exhausted PAYG after agreement</button></div>}
      <div><label htmlFor="account-note" className="block text-sm mb-1">Change note (optional)</label><textarea id="account-note" value={note} maxLength={500} disabled={busy} onChange={event => setNote(event.target.value)} className={fieldClass}/></div>
      <div className="space-y-2"><label htmlFor="account-plan" className="block text-sm">Agreed plan</label>
        <select id="account-plan" value={plan} disabled={busy} onChange={event => setPlan(event.target.value)} className={fieldClass}><option value="starter">Starter (Free)</option><option value="payg">Pay-As-You-Go (€25 one-time)</option><option value="professional">Professional (€49/month)</option><option value="business">Business (€99/month)</option></select>
        <label htmlFor="account-status" className="block text-sm">Activation status</label><select id="account-status" value={status} disabled={busy} onChange={event => setStatus(event.target.value)} className={fieldClass}><option value="free">Free / not activated</option><option value="active">Active after agreement</option></select>
        <p className="text-xs text-[#b7b7b7]">Activate paid plans after agreement. New PAYG activation grants 500 questions for 3 months; use explicit renewal for another agreed period. Returning to Starter preserves its previously used allowance.</p>
        <button disabled={busy} onClick={() => save({ plan, subscription_status: status })} className={buttonClass}>Save agreed plan</button>
      </div>
      <div className="space-y-2"><label htmlFor="account-credits" className="block text-sm">Credit total</label><input id="account-credits" type="number" min={0} max={2147483647} step={1} value={credits} disabled={busy} onChange={event => setCredits(event.target.value)} className={fieldClass}/><button disabled={busy} onClick={saveCredits} className={buttonClass}>Save credit total</button></div>
      <div className="space-y-2"><label htmlFor="account-credit-delta" className="block text-sm">Credits to add</label><input id="account-credit-delta" type="number" min={1} max={2147483647} step={1} value={delta} disabled={busy} onChange={event => setDelta(event.target.value)} className={fieldClass}/><button disabled={busy} onClick={addCredits} className={buttonClass}>Add credits</button></div>
      <div className="space-y-2"><label htmlFor="account-role" className="block text-sm">Account role</label><select id="account-role" value={role} disabled={busy} onChange={event => setRole(event.target.value)} className={fieldClass}><option value="client">Client</option><option value="consultant">Consultant</option><option value="admin">Administrator</option></select><button disabled={busy} onClick={() => save({ role })} className={buttonClass}>Save role</button></div>
      <div className="flex flex-wrap gap-3">{emailValid && <a href={'mailto:' + encodeURIComponent(client.email)} className="px-3 py-2 border border-white/20 rounded text-sm">Open email app</a>}<button disabled={busy} onClick={onBookMeeting} className="px-3 py-2 border border-white/20 rounded text-sm disabled:opacity-50">Book meeting</button></div>
      <div className="space-y-2 border-t border-white/10 pt-4"><h3 className="font-semibold">Recent account changes</h3><button disabled={auditLoading} onClick={loadAudit} className="text-sm underline">Refresh change history</button>
        {auditError && <p role="alert" className="text-sm text-red-300">{auditError}</p>}
        {auditLoading ? <p className="text-sm text-[#b7b7b7]">Loading change history…</p> : <>{audit.map(item => <div key={item.id} className="p-3 border border-white/10 rounded text-sm"><p>{item.actor_name || item.actor_id} · {new Date(item.created_at).toLocaleString()}</p><p className="text-[#b7b7b7]">{Object.keys(item.after_values).filter(key => item.after_values[key] !== item.before_values[key]).map(key => key + ': ' + String(item.before_values[key] ?? '—') + ' → ' + String(item.after_values[key] ?? '—')).join('; ')}</p>{item.note && <p className="whitespace-pre-wrap break-words">{item.note}</p>}</div>)}{!auditError && audit.length === 0 && <p className="text-sm text-[#b7b7b7]">No recorded account changes yet.</p>}</>}
      </div>
    </section>
  </div>;
}
