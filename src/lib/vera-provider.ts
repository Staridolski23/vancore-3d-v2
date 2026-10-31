import 'server-only';

export type VeraTurn = { role: 'user' | 'assistant'; content: string };
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
export function createVeraProvider({ key = process.env.NOUS_API_KEY || '', fetcher = fetch } = {}) {
  return async (system: string, history: VeraTurn[], message: string) => {
    if (!key) return null;
    try {
      const response = await fetcher('https://inference-api.nousresearch.com/v1/chat/completions', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://www.vancoresys.com', 'X-Title': 'VANCORE AI Analyst' },
        body: JSON.stringify({ model: VERA_MODEL, tags: ['user=vancore-web'], messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }], max_tokens: 4096, temperature: 0.35 }),
      });
      if (!response.ok) { console.error('Vera provider request failed', { status: response.status }); return null; }
      const data = await response.json();
      // Never substitute private reasoning fields for an absent final answer.
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) { console.error('Vera provider returned no final answer'); return null; }
      const reply = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim();
      return reply ? { reply } : null;
    } catch (error) { console.error('Vera provider temporarily unavailable', { timedOut: error instanceof Error && error.name === 'TimeoutError' }); return null; }
  };
}
