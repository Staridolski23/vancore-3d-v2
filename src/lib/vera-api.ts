import 'server-only';
import { NextRequest } from 'next/server';
import { requestUser, authFailure } from './request-auth';
import { sameOrigin } from './session-cookie';
import { supabaseAdmin } from './supabase';
import { setVeraCookie } from './vera-cookie';
import { answerVera } from './vera-answers';
import { analyseVera, analysisText, type CaseEvidence } from './vera-analysis';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
class DatabaseFailure extends Error { constructor(public code?: string) { super('Vera storage unavailable'); } }
async function owner(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return { denied: setVeraCookie(authFailure(request)) };
  if (user.is_anonymous || !user.email || !user.email_confirmed_at) return { denied: setVeraCookie(json({ error: 'Verify your registered email before using Vera.' }, 403)) };
  return { p_user: user.id, p_cap: null, kind: 'account' as const };
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
  const response = json({ ...data, owner: identity.kind, lease: undefined, history: undefined, caseMemory: undefined }, status);
  if (status === 202 || status === 429) response.headers.set('Retry-After', String(data.retryAfterSeconds || 3));
  return setVeraCookie(response);
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
    const identity = await owner(request); if (identity.denied) return identity.denied;
    const query = new URL(request.url).searchParams, conversation = query.get('conversationId'), report = query.get('reportId'), analysis = query.get('analysisId');
    if ((conversation && !uuid(conversation)) || (report && !uuid(report)) || (analysis && !uuid(analysis)) || (analysis && report)) return json({ error: 'Invalid identifier.' }, 400);
    const data = await rpc(identity, analysis ? 'analysis_read' : report ? 'report_read' : query.get('analyses') === '1' ? 'analysis_list' : 'read', conversation, analysis || report);
    if (analysis && data.state === 'analysis' && query.get('download') === '1') {
      let content = analysisText(data.analysis.content, data.analysis.notes_snapshot) + `\n\nSaved: ${data.analysis.created_at}\nSource version: ${data.analysis.source_version}\nModel: ${data.analysis.model || 'not recorded'}\n`;
      for (const review of data.reviews || []) content += `\nVANCORE CONSULTANT REVIEW — ${review.created_at}\n${review.body}\n`;
      return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="vancore-analysis-${analysis}.txt"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (report && data.state === 'report' && query.get('download') === '1') return new Response(reportText(data.report), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="vancore-brief-${report}.txt"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    return publicResult(data, identity);
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Access denied.' }, 403);
  try {
    const raw = await request.text(); if (raw.length > 12000) return json({ error: 'Request is too long.' }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || !['open', 'message', 'report', 'memory', 'analysis', 'handoff', 'cancel_handoff'].includes(body.action) || !uuid(body.conversationId)) return json({ error: 'Invalid conversation request.' }, 400);
    const fields: Record<string, string[]> = { open: [], message: ['requestId', 'message', 'expectedVersion'], report: [], memory: ['notes', 'expectedVersion'], analysis: ['requestId', 'expectedVersion'], handoff: ['analysisId', 'message', 'shareWithTeam', 'expectedVersion'], cancel_handoff: ['handoffId', 'expectedVersion'] };
    if (Object.keys(body).some(key => !['action', 'conversationId', ...fields[body.action]].includes(key))) return json({ error: 'Unsupported request fields.' }, 400);
    if (['message', 'analysis', 'memory', 'cancel_handoff'].includes(body.action) && (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0)) return json({ error: 'The current version is required.' }, 400);
    if (body.action === 'handoff' && body.expectedVersion !== undefined && (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0)) return json({ error: 'The current handoff version is required.' }, 400);
    if (['message', 'analysis'].includes(body.action) && !uuid(body.requestId)) return json({ error: 'A request identifier is required.' }, 400);
    if (body.action === 'message' && (typeof body.message !== 'string' || !body.message.trim() || body.message.trim().length > 6000)) return json({ error: 'A message is required.' }, 400);
    if (body.action === 'memory' && (typeof body.notes !== 'string' || body.notes.length > 6000)) return json({ error: 'Case notes must be at most 6000 characters.' }, 400);
    if (body.action === 'handoff' && (!uuid(body.analysisId) || body.shareWithTeam !== true || typeof body.message !== 'string' || body.message.length > 2000)) return json({ error: 'Choose a report and explicitly agree to share it with the team.' }, 400);
    if (body.action === 'cancel_handoff' && !uuid(body.handoffId)) return json({ error: 'A handoff identifier is required.' }, 400);
    const identity = await owner(request); if (identity.denied) return identity.denied;
    if (!['message', 'analysis'].includes(body.action)) return publicResult(await rpc(identity, body.action, body.conversationId, body.analysisId || body.handoffId || null, { notes: body.notes, expectedVersion: body.expectedVersion, message: body.message, shareWithTeam: body.shareWithTeam }), identity);
    const message = body.action === 'analysis' ? 'Prepare the structured AI draft assessment for this case using its stored evidence and case notes.' : body.message.trim();
    const started = await rpc(identity, 'begin', body.conversationId, body.requestId, { message, expectedVersion: body.expectedVersion, kind: body.action === 'analysis' ? 'analysis' : 'conversation' });
    if (started.state !== 'generate') return publicResult(started, identity);
    const answer = body.action === 'analysis' ? await analyseVera(started.history, started.message, started.caseMemory as CaseEvidence) : await answerVera(started.history, started.message, started.caseMemory);
    const completed = await rpc(identity, 'finish', body.conversationId, body.requestId, { lease: started.lease, ...answer });
    return publicResult(completed, identity);
  } catch (error) { return failure(error); }
}
