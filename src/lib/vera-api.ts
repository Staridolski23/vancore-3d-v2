import 'server-only';
import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { requestUser, authFailure } from './request-auth';
import { sameOrigin } from './session-cookie';
import { supabaseAdmin } from './supabase';
import { setVeraCookie, veraCookie } from './vera-cookie';
import { answerVera } from './vera-answers';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
class DatabaseFailure extends Error { constructor(public code?: string) { super('Vera storage unavailable'); } }
async function owner(request: NextRequest, create = false) {
  const user = await requestUser(request);
  if (!user && (request.headers.has('authorization') || authFailure(request).status === 503)) return { denied: authFailure(request) };
  const existing = veraCookie(request), cookie = user ? null : existing || (create ? randomBytes(32).toString('base64url') : null);
  return { p_user: user?.id || null, p_cap: cookie ? createHash('sha256').update(cookie).digest('hex') : null, cookie: !existing ? cookie : null, kind: user ? 'account' : 'visitor' };
}
async function rpc(identity: Awaited<ReturnType<typeof owner>>, action: string, conversation: string | null = null, request: string | null = null, input: object = {}) {
  const { data, error } = await supabaseAdmin.rpc('vancore_vera', { p_action: action, p_user: identity.p_user, p_cap: identity.p_cap, p_conversation: conversation, p_request: request, p_input: input });
  if (error) throw new DatabaseFailure(error.code);
  if (!data || typeof data.state !== 'string') throw new DatabaseFailure();
  return data;
}
function failure(error: unknown) {
  const code = error instanceof DatabaseFailure ? error.code : null;
  return code === 'P0002' ? json({ error: 'Conversation or report not found.' }, 404) : code === '42501' ? json({ error: 'Access denied.' }, 403) : code === '40001' ? json({ error: 'The conversation changed or the request expired. Reload before retrying.' }, 409) : code === '22023' ? json({ error: 'Check the submitted message and required choices.' }, 400) : json({ error: 'Vera could not confirm the result. Reload the conversation before retrying; use the same request.' }, 503);
}
function publicResult(data: any, identity: Awaited<ReturnType<typeof owner>>) {
  const status = data.state === 'expired' ? 410 : data.state === 'rate_limited' ? 429 : data.state === 'quota' || data.state === 'conversation_limit' ? 409 : data.state === 'pending' ? 202 : 200;
  const response = json({ ...data, owner: identity.kind, lease: undefined, history: undefined }, status);
  if (status === 202 || status === 429) response.headers.set('Retry-After', String(data.retryAfterSeconds || 3));
  if (data.state === 'expired') setVeraCookie(response);
  else if (identity.cookie && status === 200) setVeraCookie(response, identity.cookie);
  return response;
}
function reportText(report: any) {
  const lines = ['VANCORE — Preliminary conversation brief', report.title, `Version: ${report.version}`, `Saved: ${report.created_at}`, '', report.content.disclosure, report.content.partialHistory ? 'Includes the most recent 100 requests; older conversation history is not included.' : '', ''];
  for (const turn of report.content.sourceRequests || []) {
    lines.push(`Request ${turn.id} | ${turn.created_at}`, 'User statement (unverified):', turn.message, '');
    if (turn.status === 'complete') lines.push(`Vera response (${turn.mode}; preliminary; model: ${turn.model || 'not applicable/not recorded'}):`, turn.reply || '', '');
    else lines.push(`Response status: ${turn.status}; no completed analysis.`, '');
  }
  return lines.join('\n');
}
export async function GET(request: NextRequest) {
  try {
    const identity = await owner(request, true); if (identity.denied) return identity.denied;
    const query = new URL(request.url).searchParams, conversation = query.get('conversationId'), report = query.get('reportId');
    if ((conversation && !uuid(conversation)) || (report && !uuid(report))) return json({ error: 'Invalid identifier.' }, 400);
    if (!identity.p_user && !identity.p_cap) return json({ state: 'empty', owner: 'visitor', conversation: null, conversations: [], requests: [], reports: [] });
    const data = await rpc(identity, report ? 'report_read' : 'read', conversation, report);
    if (report && data.state === 'report' && query.get('download') === '1') return new Response(reportText(data.report), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="vancore-brief-${report}.txt"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    return publicResult(data, identity);
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Access denied.' }, 403);
  try {
    const raw = await request.text(); if (raw.length > 12000) return json({ error: 'Request is too long.' }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || !['open', 'message', 'report'].includes(body.action) || !uuid(body.conversationId)) return json({ error: 'Invalid conversation request.' }, 400);
    if (Object.keys(body).some(key => !['action', 'conversationId', 'requestId', 'message', 'expectedVersion', 'lead'].includes(key))) return json({ error: 'Unsupported request fields.' }, 400);
    if (body.action === 'message' && (!uuid(body.requestId) || typeof body.message !== 'string' || !body.message.trim() || body.message.trim().length > 6000 || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0)) return json({ error: 'A message and current conversation version are required.' }, 400);
    if (body.lead && (typeof body.lead !== 'object' || Array.isArray(body.lead) || ['name', 'email', 'company', 'phone'].some(key => body.lead[key] !== undefined && typeof body.lead[key] !== 'string'))) return json({ error: 'Invalid contact details.' }, 400);
    const identity = await owner(request); if (identity.denied) return identity.denied;
    if (!identity.p_user && !identity.p_cap) return json({ error: 'Start or restore your conversation first.' }, 401);
    if (body.action !== 'message') return publicResult(await rpc(identity, body.action, body.conversationId, null, { lead: body.lead }), identity);
    const started = await rpc(identity, 'begin', body.conversationId, body.requestId, { message: body.message.trim(), expectedVersion: body.expectedVersion });
    if (started.state !== 'generate') return publicResult(started, identity);
    const answer = await answerVera(started.history, started.message);
    const completed = await rpc(identity, 'finish', body.conversationId, body.requestId, { lease: started.lease, ...answer });
    return publicResult(completed, identity);
  } catch (error) { return failure(error); }
}
