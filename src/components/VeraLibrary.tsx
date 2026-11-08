'use client';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { downloadVeraBrief } from '@/lib/vera-download';
import type { VeraState } from '@/lib/vera-types';
export default function VeraLibrary({ mode }: { mode: 'history' | 'reports' }) {
  const [data, setData] = useState<VeraState | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await authenticatedFetch('/api/ai-analyst'), result = await response.json();
      if (!response.ok || result.owner !== 'account' || !Array.isArray(result.conversations) || !Array.isArray(result.reports || [])) throw new Error();
      setData(result);
    } catch { setError('Vera history could not be loaded. Previously loaded records are retained. Please retry.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const download = async (id: string) => { try { setError(''); await downloadVeraBrief(id); } catch { setError('The saved brief could not be downloaded. Please retry.'); } };
  return <section className="bg-[#111] border border-white/10 rounded-xl p-5 text-white space-y-4"><h3 className="font-semibold">{mode === 'history' ? 'Vera conversations' : 'Saved Vera briefs'}</h3>
    <p className="text-xs text-[#b5b5b5]">{mode === 'history' ? 'AI conversation history is separate from messages to the VANCORE team.' : 'Preliminary snapshots of saved conversations. These have not been independently verified or reviewed by a human consultant.'} Showing up to 50 recent records.</p>
    {loading && <p role="status">Loading…</p>}{error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
    <div className="flex gap-4 text-sm"><button className="underline" disabled={loading} onClick={() => void load()}>Refresh Vera history</button><a className="underline" href="/ai-analyst">Open Vera</a></div>
    {mode === 'history' ? data?.conversations.map(item => <a className="block border-t border-white/10 pt-3 text-sm underline" key={item.id} href={'/ai-analyst?conversation=' + encodeURIComponent(item.id)}>{item.title}</a>) : data?.reports?.map(report => <div className="border-t border-white/10 pt-3 text-sm flex justify-between gap-3" key={report.id}><span>{report.title} · version {report.version}</span><button className="underline" onClick={() => void download(report.id)}>Download brief</button></div>)}
    {!loading && !error && (mode === 'history' ? data?.conversations.length === 0 : !data?.reports?.length) && <p className="text-sm text-[#b5b5b5]">{mode === 'history' ? 'No saved Vera conversations yet.' : 'No saved briefs yet. Open a Vera conversation and save a preliminary brief after an answer.'}</p>}
  </section>;
}
