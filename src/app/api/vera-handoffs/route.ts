import { NextRequest } from 'next/server';
import { requestUser, authFailure } from '@/lib/request-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sameOrigin } from '@/lib/session-cookie';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
async function run(request: NextRequest, body?: Record<string, unknown>) {
  const user = await requestUser(request); if (!user) { const denied = authFailure(request); denied.headers.set('Cache-Control', 'private, no-store'); return denied; }
  if (!['admin', 'consultant'].includes(user.vancoreRole)) return json({ error: 'Staff access required.' }, 403);
  const id = body?.id || new URL(request.url).searchParams.get('id'), action = body?.action || (id ? 'read' : 'list');
  if ((id && !uuid(id)) || (action !== 'list' && !uuid(id))) return json({ error: 'Invalid handoff.' }, 400);
  if (body) {
    if (!['assign', 'status', 'review'].includes(String(action)) || Object.keys(body).some(key => !['id', 'action', 'expectedVersion', 'assignee', 'status', 'body'].includes(key)) || !Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 0) return json({ error: 'A current handoff version is required.' }, 400);
    if (action === 'assign' && (user.vancoreRole !== 'admin' || !uuid(body.assignee))) return json({ error: 'Administrator assignment required.' }, 403);
    if (action === 'status' && body.status !== 'in_review') return json({ error: 'Invalid status.' }, 400);
    if (action === 'review' && (typeof body.body !== 'string' || body.body.trim().length < 40 || body.body.length > 12000)) return json({ error: 'Write a review of 40–12000 characters.' }, 400);
  }
  const { data, error } = await supabaseAdmin.rpc('vancore_vera_handoffs', { p_actor: user.id, p_action: action, p_id: id || null, p_input: body ? { assignee: body.assignee, status: body.status, body: body.body } : {}, p_expected_version: body?.expectedVersion ?? null });
  if (error) return error.code === 'P0002' ? json({ error: 'Handoff not found or no longer shared.' }, 404) : error.code === '40001' ? json({ error: 'The handoff changed. Reload before retrying.' }, 409) : error.code === '42501' ? json({ error: 'Access denied.' }, 403) : error.code === '22023' ? json({ error: 'Check the submitted fields.' }, 400) : json({ error: 'The result could not be confirmed. Reload before retrying.' }, 503);
  return json(data);
}
export async function GET(request: NextRequest) { try { return await run(request); } catch { return json({ error: 'Handoffs unavailable. Please retry.' }, 503); } }
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Access denied.' }, 403);
  let body;
  try { const raw = await request.text(); if (raw.length > 16000) return json({ error: 'Request too long.' }, 413); body = JSON.parse(raw); if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400); } catch { return json({ error: 'Invalid request.' }, 400); }
  try { return await run(request, body); } catch { return json({ error: 'Result unavailable. Reload before retrying.' }, 503); }
}
