export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = process.env.NOUS_API_KEY || '';
const MODEL = 'stepfun/step-3.7-flash:free';
const SYSTEM_PROMPT = `You are Vera, an AI Business Analyst for VANCORE. Your ONLY identity is Vera. You are NOT LFM, NOT Liquid AI, and NOT any other model. Never mention being an AI, model, or assistant. Speak as a professional business analyst who works at VANCORE. Do not show reasoning, planning, or self-talk. Output only the final answer to the user.

COMPANY FACTS:
- VANCORE is a boutique business analysis & development consultancy based in Sofia, Bulgaria.
- Founded in 2020 by Momchil Staridolski (CEO) and Zhanet Topalova (Co-Founder).
- Tagline: "The clarity your company has been missing."
- 47+ engagements delivered, 92% client retention, 6+ years embedded operational experience.
- Services: Business Analysis, Process Re-engineering, Change Management, Implementation Support.
- Method: Discovery → Diagnosis → Design → Deployment.
- Pricing: Starter €499/month, Growth €999/month, Scale €1,999/month. 14-day free trial.
- Contact: hello@vancoresys.com. Office: Sofia, Bulgaria.
- Security: AES-256 encryption, TLS 1.2+, JWT + RBAC, EU data residency.

Use these facts accurately.`;

type KnowledgeBase = {
  faq: { keywords: string[]; answer: string }[];
  companyInfo: string;
  teamInfo: string;
  processInfo: string;
  defaultFallback: string;
};

const KNOWLEDGE_BASE: KnowledgeBase = {
  faq: [
    {
      keywords: ['price', 'pricing', 'cost', 'how much', 'package', 'plan', 'subscription', 'rates'],
      answer: 'Our plans start from €499/month for Starter, €999/month for Growth, and €1,999/month for Scale. We also offer a 14-day free trial. All prices exclude VAT where applicable.',
    },
    {
      keywords: ['service', 'services', 'what do you do', 'offer', 'solutions', 'specialize'],
      answer: 'We specialize in Business Analysis, Process Re-engineering, Change Management, and Implementation Support. We help companies clarify operations, reduce chaos, and improve delivery.',
    },
    {
      keywords: ['contact', 'email', 'phone', 'reach', 'book', 'call', 'meeting', 'hello'],
      answer: 'You can reach us at hello@vancoresys.com or book a call through our website. We usually respond within 24 hours. Our office is in Sofia, Bulgaria.',
    },
    {
      keywords: ['team', 'who are you', 'about', 'company', 'vancore', 'tell me about'],
      answer: 'VANCORE is a boutique business analysis & development consultancy. We help companies see clearly through internal complexity — and act on what they find. We operate at the intersection of operations, technology, and people.',
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
      keywords: ['industry', 'sector', 'horeca', 'retail', 'e-commerce', 'logistics', 'work with'],
      answer: 'We work across HoReCa, retail, e-commerce, logistics, and B2B services. Our methods are industry-agnostic, but we bring relevant benchmarks.',
    },
    {
      keywords: ['result', 'guarantee', 'outcome', 'roi', 'benefit', 'value'],
      answer: 'We focus on measurable outcomes: fewer bottlenecks, clearer ownership, shorter cycles, and better handoffs. Results depend on scope and client commitment.',
    },
    {
      keywords: ['founder', 'ceo', 'momchil', 'zhanet', 'team', 'who runs', 'leadership'],
      answer: 'VANCORE was founded by Momchil Staridolski and Zhanet Topalova. Momchil is the CEO with strong operations and tech background. Zhanet is Co-Founder with expertise in business analysis, strategic planning, and process optimization.',
    },
    {
      keywords: ['method', 'process', 'how do you work', 'approach', 'steps', 'framework'],
      answer: 'Our method has 4 steps: Discovery → Diagnosis → Design → Deployment. We start small, ask sharp questions, and listen longer. Then we move to structured change and rollout.',
    },
    {
      keywords: ['trial', 'free', 'test', 'try'],
      answer: 'We offer a 14-day free trial on all plans. No credit card required to start.',
    },
    {
      keywords: ['book', 'appointment', 'schedule', 'call', 'meeting'],
      answer: 'You can book a call through our website or email hello@vancoresys.com. We usually respond within 24 hours.',
    },
    {
      keywords: ['security', 'gdpr', 'data', 'privacy', 'encryption'],
      answer: 'We take data security seriously. Our stack uses AES-256 encryption, TLS 1.2+, JWT authentication with role-based access control, and EU data residency through Supabase EU and DigitalOcean Frankfurt.',
    },
    {
      keywords: ['client portal', 'portal', 'login', 'dashboard'],
      answer: 'Clients get access to a dedicated portal where they can track bookings, documents, reviews, and reports. Sign in is available from the top right.',
    },
    {
      keywords: ['years', 'experience', 'since', 'history'],
      answer: 'VANCORE was founded in 2020 and has since delivered 47+ engagements with 92% client retention. We have 6+ years of embedded operational experience.',
    },
  ],
  companyInfo: `VANCORE Systems is a boutique business analysis & development consultancy founded in 2020 and based in Sofia, Bulgaria. We help companies see clearly through internal complexity — and act on what they find. Our tagline: "The clarity your company has been missing." We operate at the intersection of operations, technology, and people. We stay small by design so we can stay close to the work. Key metrics: 47+ engagements delivered, 92% client retention, 2 founders hands-on. Contact: hello@vancoresys.com`,
  teamInfo: `VANCORE was founded by Momchil Staridolski (CEO) and Zhanet Topalova (Co-Founder). Momchil has strong operations and tech background. Zhanet has expertise in business analysis, strategic planning, and process optimization. Both are hands-on and involved in engagements.`,
  processInfo: `Our 4-step method: 1) Discovery - we start small, ask sharp questions, and listen longer; 2) Diagnosis - we analyze every process and identify bottlenecks; 3) Design - we redesign workflows and optimize schedules; 4) Deployment - we implement structured change and rollout.`,
  defaultFallback: 'Thanks for the details. To give you a useful, specific answer, I’d recommend a short discovery call. You can book one on our website or email hello@vancoresys.com.',
};

function matchAnswer(message: string): string {
  const lower = message.toLowerCase();

  // Direct FAQ match
  for (const item of KNOWLEDGE_BASE.faq) {
    if (item.keywords.some((keyword) => lower.includes(keyword))) {
      return item.answer;
    }
  }

  // Company info
  if (lower.includes('company') || lower.includes('about') || lower.includes('who are you') || lower.includes('tell me about vancore')) {
    return KNOWLEDGE_BASE.companyInfo;
  }

  // Team info
  if (lower.includes('founder') || lower.includes('ceo') || lower.includes('momchil') || lower.includes('zhanet') || lower.includes('team') || lower.includes('leadership')) {
    return KNOWLEDGE_BASE.teamInfo;
  }

  // Process info
  if (lower.includes('method') || lower.includes('process') || lower.includes('approach') || lower.includes('framework') || lower.includes('how do you work')) {
    return KNOWLEDGE_BASE.processInfo;
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
    const res = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
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
        max_tokens: 420,
        temperature: 0.4,
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
    const rawReply = data?.choices?.[0]?.message?.content?.trim() || '';
    const reasoningReply = data?.choices?.[0]?.message?.reasoning_details?.[0]?.text?.trim() || '';
    const combined = rawReply || reasoningReply || '';

    if (!combined) {
      return null;
    }

    // Heuristic: extract the final user-facing paragraph.
    const paragraphs = combined.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const candidate = paragraphs[paragraphs.length - 1] || combined;

    let cleaned = candidate;
    const badOpeners = [
      'The user is asking about',
      'However, I need to be careful',
      'I should answer based on',
      'Let me provide a balanced',
      "I don't have specific",
      'I should give a helpful response',
      'Since this is a specific product',
      'The user is',
      'Actually, looking at my system prompt',
      'Since I don\'t have real-time access',
      'I should answer this directly',
      'I don\'t have exact current',
      'VANCORE appears to be',
      'Typical pricing models',
      'I should give them accurate',
      'Let me provide general',
      'But wait',
      'there\'s a potential issue',
      'these seem like different businesses',
      'the user might be referring to VANCORE',
      'or they might be confused',
      'Got it, let\'s see',
      'Got it, let\'s tackle this',
      'First, I need to',
      'Wait let\'s structure it',
      'First, start with the basics',
      'Wait, let\'s',
      'Wait,',
      'Wait',
      'let\'s make it natural',
      'Oh right,',
      'Oh right',
      'Next,',
      'Then mention',
      'Then our',
      'Maybe add',
    ];
    for (const opener of badOpeners) {
      const idx = cleaned.indexOf(opener);
      if (idx !== -1) {
        const nextDouble = cleaned.indexOf('\n\n', idx);
        if (nextDouble !== -1) {
          cleaned = cleaned.slice(0, idx) + cleaned.slice(nextDouble + 2);
        } else {
          cleaned = cleaned.slice(0, idx);
        }
      }
    }

    cleaned = cleaned
      .replace(/I'm LFM[^\n]*/gi, '')
      .replace(/built by Liquid AI[^\n]*/gi, '')
      .replace(/enterprise-grade foundation model family[^\n]*/gi, '')
      .replace(/VANCORE \(VANCORE\)[^\n]*/gi, '')
      .replace(/on-device intelligence[^\n]*/gi, '')
      .replace(/\bLFM\b/gi, '')
      .replace(/\bLiquid AI\b/gi, '')
      .replace(/^\n+/, '')
      .trim();

    const reply = cleaned || KNOWLEDGE_BASE.defaultFallback;
    if (!reply) return null;

    // Safety net: if reply still looks like reasoning, do not expose it
    const lowerReply = reply.toLowerCase();
    if (
      lowerReply.includes('the user is asking') ||
      lowerReply.includes('i should answer') ||
      lowerReply.includes('got it') ||
      lowerReply.includes('let me provide') ||
      lowerReply.includes('wait let') ||
      lowerReply.includes('wait, let') ||
      lowerReply.includes('but wait')
    ) {
      return { reply: KNOWLEDGE_BASE.defaultFallback, step: 7 };
    }

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

    // Primary: OpenRouter LLM
    let reply = '';
    let newStep = step;

    const openRouterResult = await askOpenRouter(message);
    if (openRouterResult) {
      reply = openRouterResult.reply;
      newStep = openRouterResult.step || step;
    } else {
      // Fallback only if OpenRouter fails
      reply = matchAnswer(message);
      newStep = nextStep(step);
    }

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
