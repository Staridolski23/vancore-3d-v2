export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = 'meta-llama/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You are Vera, a helpful AI Business Analyst for VANCORE. Your role is to understand the user's operational challenges and prepare a brief for the VANCORE team. Be concise, professional, and ask one focused question at a time. Keep responses under 2 sentences unless the user asks for details. If the user asks about pricing, services, or company info, provide accurate information.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const sessionId = String(body?.sessionId || '').trim();
    const step = Number(body?.step || 0);

    if (!message) {
      return new Response(JSON.stringify({
        reply: 'Please share a short description of your case.',
        step: 0,
        sessionId: sessionId || 'session-' + Date.now(),
        quickReplies: [],
        placeholder: 'Type your answer...',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({
        reply: 'Vera is currently unavailable. Please try again later or contact hello@vancoresys.com.',
        step: 0,
        sessionId,
        quickReplies: [],
        placeholder: '',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.vancoresys.com',
          'X-Title': 'VANCORE AI Analyst',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('OpenRouter error:', res.status, errorText);
        return new Response(JSON.stringify({
          reply: 'Vera is temporarily unavailable. Please try again or contact hello@vancoresys.com.',
          step: 0,
          sessionId,
          quickReplies: [],
          placeholder: '',
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'Thank you for your message. A consultant will review it shortly.';

      const newStep = step >= 3 ? 7 : step + 1;

      return new Response(JSON.stringify({
        reply,
        step: newStep,
        sessionId: sessionId || 'session-' + Date.now(),
        quickReplies: newStep >= 7 ? [] : [],
        placeholder: 'Type your answer...',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('OpenRouter timeout/network error:', error);
      return new Response(JSON.stringify({
        reply: 'Vera is taking too long to respond. Please try again or contact hello@vancoresys.com.',
        step: 0,
        sessionId,
        quickReplies: [],
        placeholder: '',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      reply: 'Sorry — Vera is unavailable right now. Please try again or contact hello@vancoresys.com.',
      step: 0,
      sessionId: '',
      quickReplies: [],
      placeholder: '',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    ok: !!OPENROUTER_API_KEY,
    endpoint: '/api/ai-analyst',
    model: MODEL,
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
