import { createVeraProvider, validateVeraHistory } from '@/lib/vera-provider';
import { sameOrigin } from '@/lib/session-cookie';
import { randomUUID } from 'node:crypto';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const askProvider = createVeraProvider();
const SYSTEM_PROMPT = `You are Vera, an AI Business Analyst for VANCORE. You are VANCORE's AI analyst. Be transparent about being AI when asked. Speak professionally and never pretend to be a human consultant. Output only the final answer to the user. Do not include reasoning, planning, self-talk, or meta-commentary.

COMPANY FACTS:
- VANCORE is a boutique business analysis & development consultancy based in Sofia, Bulgaria.
- Founded in 2020 by Momchil Staridolski (CEO) and Zhanet Topalova (Co-Founder).
- Tagline: "The clarity your company has been missing."
- 47+ engagements delivered, 92% client retention, 6+ years embedded operational experience.
- Services: Business Analysis, Process Re-engineering, Change Management, Implementation Support.
- Method: Discovery → Diagnosis → Design → Deployment.
- Pricing: Pay-As-You-Go €25 one-time, Professional €49/month, Business €99/month. Pay-As-You-Go is a one-time purchase, not a monthly subscription. 14-day free trial.
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
      answer: 'Our plans are Pay-As-You-Go at €25 as a one-time purchase, Professional at €49/month, and Business at €99/month. We also offer a 14-day free trial. All prices exclude VAT where applicable.',
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
      answer: 'Pay-As-You-Go includes basic support. Professional includes priority support. Business includes the Professional features and two human consultant calls per month.',
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

function limitedReply(message: string, stage: number) {
  const bg = /[а-яА-Я]/.test(message);
  if (/\b(pric(?:e|es|ing)|subscription|rates)\b|цен(?:а|и|ите)|абонамент/i.test(message)) return bg
    ? 'Плановете са Pay-As-You-Go — €25 еднократно, Professional — €49 месечно и Business — €99 месечно.'
    : KNOWLEDGE_BASE.faq[0].answer;
  if (/^(how (?:can|do) I contact|contact details|email address)|контакт|имейл/i.test(message)) return bg
    ? 'Можеш да се свържеш с екипа на hello@vancoresys.com или да запазиш разговор през сайта.'
    : KNOWLEDGE_BASE.faq[2].answer;
  const questions = bg ? [
    'Как измервате този проблем — например забавени поръчки, часове работа или пропуснати приходи?',
    'Кои хора или екипи участват и къде точно се губи информацията или отговорността?',
    'Какво вече сте опитали и какъв беше резултатът?',
    'Каква конкретна промяна искате да постигнете и в какъв срок?',
    'AI анализът е временно ограничен. Запазете разговор с екипа за преглед на събраната информация.'
  ] : [
    'How do you measure this problem — for example delayed orders, hours of work, or lost revenue?',
    'Which people or teams are involved, and where is information or ownership lost?',
    'What have you already tried, and what happened?',
    'What specific change would you like to achieve, and by when?',
    'AI analysis is temporarily limited. Book a call with our team to review the information.'
  ];
  return questions[Math.min(Math.max(stage - 1, 0), questions.length - 1)];
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Access denied' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 35000) return Response.json({ error: 'Message history is too long' }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    if (typeof body?.message !== 'string' || body.message.trim().length > 6000) return Response.json({ error: 'A message of up to 6,000 characters is required' }, { status: 400 });
    const message = body.message.trim(), history = validateVeraHistory(body.history);
    if (!history) return Response.json({ error: 'Invalid conversation history' }, { status: 400 });
    const sessionId = typeof body.sessionId === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(body.sessionId) ? body.sessionId : randomUUID();
    const step = Math.min(6, history.filter(turn => turn.role === 'user').length + 1);
    const headers = { 'Cache-Control': 'private, no-store' };
    if (!message || /^(hello|hi|здравей|здравейте)[!. ]*$/i.test(message)) return Response.json({ reply: /[а-яА-Я]/.test(message) ? 'Здравей! Какъв конкретен проблем в бизнеса искаш да разгледаме?' : 'Hello! What specific business problem would you like to explore?', step: 1, sessionId, mode: 'ready', quickReplies: [], placeholder: 'Type your answer...' }, { headers });
    const instructions = SYSTEM_PROMPT + '\nRespond in the language of the latest user message. Use the conversation history to avoid repeating answered questions. Ask one focused diagnostic question at a time. Distinguish provided facts from hypotheses. Do not claim to book meetings, send emails or save reports. Return the complete final answer only; no private reasoning.';
    const result = await askProvider(instructions, history, message);
    return Response.json({ reply: result?.reply || limitedReply(message, step), step, sessionId, mode: result ? 'ai' : 'limited', quickReplies: [], placeholder: 'Type your answer...' }, { headers });
  } catch {
    return Response.json({ error: 'Vera is temporarily unavailable. Please retry.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
export async function GET() { return Response.json({ ok: true, endpoint: '/api/ai-analyst', mode: 'hybrid' }, { headers: { 'Cache-Control': 'no-store' } }); }
