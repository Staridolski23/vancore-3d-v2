export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = 'liquid/lfm-2.5-2.6b:free';
const SYSTEM_PROMPT = `You are Vera, a helpful AI Business Analyst for VANCORE. Your role is to understand the user's operational challenges and prepare a brief for the VANCORE team. Be concise, professional, and ask one focused question at a time. Keep responses under 2 sentences unless the user asks for details. If the user asks about pricing, services, or company info, provide accurate information.`;

type KnowledgeBase = {
  faq: { keywords: string[]; answer: string }[];
  defaultFallback: string;
};

const KNOWLEDGE_BASE: KnowledgeBase = {
  faq: [
    {
      keywords: ['price', 'pricing', 'cost', 'how much', 'package', 'plan', 'subscription'],
      answer: 'Our plans start from €499/month for Starter, €999/month for Growth, and €1,999/month for Scale. We also offer a 14-day free trial.',
    },
    {
      keywords: ['service', 'services', 'what do you do', 'offer', 'solutions'],
      answer: 'We specialize in Business Analysis, Process Re-engineering, Change Management, and Implementation Support. We help companies clarify operations, reduce chaos, and improve delivery.',
    },
    {
      keywords: ['contact', 'email', 'phone', 'reach', 'book', 'call', 'meeting'],
      answer: 'You can reach us at hello@vancoresys.com or book a call through our website. We usually respond within 24 hours.',
    },
    {
      keywords: ['team', 'who are you', 'about', 'company', 'vancore'],
      answer: 'VANCORE is a boutique consultancy focused on messy internal problems — the ones org charts hide and reports cannot reach.',
    },
    {
      keywords: ['implementation', 'timeline', 'duration', 'how long', 'weeks', 'months'],
      answer: 'Most implementations take 4–8 weeks. We start with a short discovery phase, then move to structured change and rollout.',
    },
    {
      keywords: ['support', 'help', 'after', 'follow up', 'maintenance'],
      answer: 'Every plan includes ongoing support. Growth and Scale plans get faster response times and optional check-ins.',
    },
    {
      keywords: ['industry', 'sector', 'horeca', 'retail', 'e-commerce', 'logistics'],
      answer: 'We work across HoReCa, retail, e-commerce, logistics, and B2B services. Our methods are industry-agnostic, but we bring relevant benchmarks.',
    },
    {
      keywords: ['result', 'guarantee', 'outcome', 'roi', 'benefit', 'value'],
      answer: 'We focus on measurable outcomes: fewer bottlenecks, clearer ownership, shorter cycles, and better handoffs. Results depend on scope and client commitment.',
    },
  ],
  defaultFallback: 'Thanks for the details. To give you a useful, specific answer, I’d recommend a short discovery call. You can book one on our website or email hello@vancoresys.com.',
};

function matchAnswer(message: string): string {
  const lower = message.toLowerCase();
  for (const item of KNOWLEDGE_BASE.faq) {
    if (item.keywords.some((keyword) => lower.includes(keyword))) {
      return item.answer;
    }
  }
  return KNOWLEDGE_BASE.defaultFallback;
}

function nextStep(currentStep: number): number {
  if (currentStep >= 3) return 7;
  return currentStep + 1;
}

async function askOpenRouter(message: string): Promise<{ reply: string; step: number } | null> {
  if (!OPENROUTER_API_KEY) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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
      return null;
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!reply) return null;
    return { reply, step: 7 };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('OpenRouter timeout/network error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const sessionId = String(body?.sessionId || '').trim();
    const step = Number(body?.step || 0);

    if (!message) {
      return new Response(
        JSON.stringify({
          reply: 'Please share a short description of your case.',
          step: 0,
          sessionId: sessionId || 'session-' + Date.now(),
          quickReplies: [],
          placeholder: 'Type your answer...',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const openRouterResult = await askOpenRouter(message);
    const reply = openRouterResult?.reply ?? matchAnswer(message);
    const newStep = openRouterResult ? (openRouterResult.step || step) : nextStep(step);

    return new Response(
      JSON.stringify({
        reply,
        step: newStep,
        sessionId: sessionId || 'session-' + Date.now(),
        quickReplies: [],
        placeholder: 'Type your answer...',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        reply: 'Sorry — Vera is unavailable right now. Please try again or contact hello@vancoresys.com.',
        step: 0,
        sessionId: '',
        quickReplies: [],
        placeholder: '',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      endpoint: '/api/ai-analyst',
      mode: 'hybrid',
      model: MODEL,
      hasOpenRouterKey: !!OPENROUTER_API_KEY,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }
  );
}
