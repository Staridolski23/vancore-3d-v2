import 'server-only';

export type VeraTurn = { role: 'user' | 'assistant'; content: string };
export type VeraProviderIssue = { kind: 'rate_limit' | 'unavailable'; retryAfterSeconds?: number };
export type VeraProviderCooldown = { until: number };
// Best-effort backpressure within this server instance; no customer data is cached.
const instanceCooldown: VeraProviderCooldown = {until:0};
export function providerUnavailableReply(message: string, issue: VeraProviderIssue) {
  const bg = /[а-я]/i.test(message), seconds = issue.retryAfterSeconds;
  const delay = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? Math.max(1,Math.min(86400,Math.ceil(seconds))) : null;
  return bg
    ? (issue.kind === 'rate_limit' ? 'AI услугата временно ограничава заявките.' : 'AI услугата е временно недостъпна.') + (delay ? ` Опитай отново най-рано след ${delay} секунди.` : ' Опитай отново по-късно.') + ' Това не означава грешка в предоставените данни. Не е използван въпрос.'
    : (issue.kind === 'rate_limit' ? 'The AI service is temporarily limiting requests.' : 'The AI service is temporarily unavailable.') + (delay ? ` Try again no sooner than ${delay} seconds from now.` : ' Please try again later.') + ' This does not indicate an error in your input data. No question was used.';
}
export const VERA_MODEL = 'stepfun/step-3.7-flash:free';
export function validateVeraHistory(input: unknown): VeraTurn[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 20) return null;
  const result: VeraTurn[] = []; let size = 0;
  for (const entry of input) {
    const content = entry?.content ?? entry?.text;
    if (!entry || !['user','assistant'].includes(entry.role) || typeof content !== 'string' || content.length > 4000) return null;
    size += content.length; if (size > 20000) return null;
    result.push({ role: entry.role, content });
  }
  return result;
}
export function createVeraProvider({ key = process.env.NOUS_API_KEY || '', fetcher = fetch, maxTokens = 4096, jsonMode = false, reasoningEffort, onUnavailable, cooldown = instanceCooldown, clock = Date.now }: { key?: string; fetcher?: typeof fetch; maxTokens?: number; jsonMode?: boolean; reasoningEffort?: 'low' | 'medium' | 'high'; onUnavailable?: (issue: VeraProviderIssue) => void; cooldown?:VeraProviderCooldown; clock?:()=>number } = {}) {
  return async (system: string, history: VeraTurn[], message: string) => {
    if (!key) { onUnavailable?.({kind:'unavailable'}); return null; }
    const remaining = Math.ceil((cooldown.until-clock())/1000);
    if (remaining>0) {onUnavailable?.({kind:'rate_limit',retryAfterSeconds:Math.min(86400,remaining)});return null;}
    try {
      const response = await fetcher('https://inference-api.nousresearch.com/v1/chat/completions', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://www.vancoresys.com', 'X-Title': 'VANCORE AI Analyst' },
        body: JSON.stringify({ model: VERA_MODEL, tags: ['user=vancore-web'], messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }], max_tokens: Number.isFinite(maxTokens) ? Math.max(512, Math.min(12000, Math.trunc(maxTokens))) : 4096, temperature: 0.35, ...(jsonMode ? { response_format: { type: 'json_object' } } : {}), ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}) }),
      });
      if (!response.ok) {
        let category = 'upstream_error';
        if (response.status === 429) {
          const problem = await response.json().catch(() => null);
          const message = String(problem?.error?.message || problem?.message || '').slice(0, 2000).toLowerCase();
          category = /quota|credits|balance|daily|per.day/.test(message) ? 'quota' : /overload|capacity|temporarily unavailable/.test(message) ? 'capacity' : /max_tokens|token.*limit|output.*limit/.test(message) ? 'token_limit' : 'rate_limit';
        }
        const retry = response.headers.get('retry-after');
        const seconds = retry ? (/^\d+$/.test(retry) ? Number(retry) : (Date.parse(retry) - clock()) / 1000) : NaN;
        const retrySeconds = Number.isFinite(seconds)&&seconds>0 ? Math.max(1,Math.min(86400,Math.ceil(seconds))) : response.status===429 ? 30 : null;
        if(response.status===429)cooldown.until=Math.max(cooldown.until,clock()+retrySeconds!*1000);
        onUnavailable?.({kind:response.status===429?'rate_limit':'unavailable',...(retrySeconds?{retryAfterSeconds:retrySeconds}:{})});
        console.error('Vera provider request failed', { status: response.status, category, retryAfterSeconds: retrySeconds });
        return null;
      }
      const data = await response.json();
      // Never substitute private reasoning fields for an absent final answer.
      const content = data?.choices?.[0]?.message?.content;
      const finishReason = ['stop', 'length', 'tool_calls', 'content_filter'].includes(data?.choices?.[0]?.finish_reason) ? data.choices[0].finish_reason : 'unknown';
      if (typeof content !== 'string' || !content.trim() || finishReason === 'length') { onUnavailable?.({kind:'unavailable'}); console.error('Vera provider returned no complete final answer', { finishReason, completionTokens: Number.isFinite(data?.usage?.completion_tokens) ? data.usage.completion_tokens : null, reasoningTokens: Number.isFinite(data?.usage?.completion_tokens_details?.reasoning_tokens) ? data.usage.completion_tokens_details.reasoning_tokens : null }); return null; }
      const reply = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim();
      return reply ? { reply } : null;
    } catch (error) { onUnavailable?.({kind:'unavailable'}); console.error('Vera provider temporarily unavailable', { timedOut: error instanceof Error && error.name === 'TimeoutError' }); return null; }
  };
}
