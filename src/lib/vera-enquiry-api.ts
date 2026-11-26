import 'server-only';
import { enquiryInput, enquirySummary } from './vera-enquiry';
import { backendFetch } from './backend';
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  // Public intake only; this route never reads sessions, conversations or AI keys.
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'origin' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ error: 'format' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 16000) return json({ error: 'size' }, 413);
  try {
    const reader = request.body?.getReader(); if (!reader) return json({ error: 'input' }, 400);
    const decoder = new TextDecoder(); let raw = '', size = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 16000) { await reader.cancel(); return json({ error: 'size' }, 413); } raw += decoder.decode(part.value, { stream: true }); } } finally { reader.releaseLock(); }
    raw += decoder.decode(); let parsed; try { parsed = JSON.parse(raw); } catch { return json({ error: 'input' }, 400); }
    const input = enquiryInput(parsed); if (!input) return json({ error: 'input' }, 400);
    const response = await backendFetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: '' }, body: JSON.stringify({ sender_name: input.name, sender_email: input.email, subject: 'Vera enquiry · ' + input.topic, message: enquirySummary(input) + '\n\nSubmission: visitor explicitly approved sending this summary to VANCORE. No marketing opt-in.' }) });
    if (!response.ok) return json({ error: response.status === 429 ? 'rate' : 'unconfirmed' }, response.status === 429 ? 429 : 502);
    const saved = await response.json();
    if (saved.success !== true || typeof saved.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(saved.id)) return json({ error: 'unconfirmed' }, 502);
    return json({ success: true, reference: saved.id }, 201);
  } catch { return json({ error: 'unconfirmed' }, 502); }
}
