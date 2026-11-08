'use client';
import { authenticatedFetch } from './authenticated-fetch';
export async function downloadVeraBrief(id: string) {
  const response = await authenticatedFetch('/api/ai-analyst?reportId=' + encodeURIComponent(id) + '&download=1');
  if (!response.ok || !response.headers.get('Content-Type')?.startsWith('text/plain')) throw new Error('Brief unavailable');
  const file = await response.blob(), url = URL.createObjectURL(file), link = document.createElement('a');
  link.href = url; link.download = `vancore-brief-${id}.txt`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
