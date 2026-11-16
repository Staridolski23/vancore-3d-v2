import { NextRequest } from 'next/server';
import { requestUser, authFailure } from '@/lib/request-auth';
import { sameOrigin } from '@/lib/session-cookie';
import { veraKnowledge } from '@/lib/vera-knowledge-server';
import { answerVera } from '@/lib/vera-answers';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: NextRequest) {
  try {
    const user = await requestUser(request); if (!user) { const response = authFailure(request); response.headers.set('Cache-Control', 'private, no-store'); return response; }
    if (user.vancoreRole !== 'admin' || user.is_anonymous || !user.email_confirmed_at) return json({ error: 'Verified administrator required.' }, 403);
    return json(await veraKnowledge.evaluations(user.id));
  } catch { return json({ error: 'Evaluation archive unavailable.' }, 503); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Access denied.' }, 403);
  try {
    const user = await requestUser(request); if (!user) { const response = authFailure(request); response.headers.set('Cache-Control', 'private, no-store'); return response; }
    if (user.vancoreRole !== 'admin' || user.is_anonymous || !user.email_confirmed_at) return json({ error: 'Verified administrator required.' }, 403);
    const raw = await request.text(); if (raw.length > 500) return json({ error: 'Request too long.' }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.' }, 400); }
    if (!body || Object.keys(body).length !== 1 || typeof body.scenarioId !== 'string' || !/^[a-z-]+-v1$/.test(body.scenarioId)) return json({ error: 'Choose a fixed evaluation scenario.' }, 400);
    const scenario = await veraKnowledge.scenario(body.scenarioId, user.id);
    const result = await answerVera(scenario.scenario.history, scenario.scenario.message);
    const checks = { aiAvailable: result.mode === 'ai', cyrillicPresent: /[а-я]/i.test(result.reply), questionMarks: (result.reply.match(/\?/g) || []).length, chars: result.reply.length, ...(body.scenarioId === 'business-margin-v1' ? { expectedMarginPresent: /gross_margin_percent:\s*25\s*%/.test(result.reply) } : {}), qualification: 'Mechanical observations only; professional quality requires human review.' };
    const saved = await veraKnowledge.saveEvaluation(body.scenarioId, user.id, scenario.lease, result, checks);
    if (saved?.saved !== true) return json({ error: 'Evaluation result could not be archived.' }, 503);
    return json({ ...saved, mode: result.mode, output: result.reply, checks, suiteVersion: scenario.suite_version });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    return code === '55P03' ? json({ error: 'Another evaluation is running or the evaluation limit was reached.' }, 429) : code === '22023' ? json({ error: 'Unknown fixed scenario.' }, 400) : json({ error: 'Evaluation unavailable or not confirmed. No client question was used.' }, 503);
  }
}
