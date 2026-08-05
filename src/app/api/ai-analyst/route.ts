export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStepResponse(step: number, message: string) {
  const lower = message.toLowerCase();
  if (step === 0) {
    return {
      reply: 'Thanks — let’s start with the basics. What is your main operational challenge right now?',
      step: 1,
      quickReplies: ['Booking chaos', 'Document overload', 'No visibility', 'Team misalignment'],
      placeholder: 'Type your answer...',
    };
  }
  if (step === 1) {
    return {
      reply: 'Good. How many people are affected by this on a weekly basis?',
      step: 2,
      quickReplies: ['Just me', '2–5 people', '6–20 people', '20+ people'],
      placeholder: 'Type your answer...',
    };
  }
  if (step === 2) {
    return {
      reply: 'What’s the cost of the problem? Lost revenue, wasted hours, or client churn?',
      step: 3,
      quickReplies: ['Lost revenue', 'Wasted hours', 'Client churn', 'Mix of all'],
      placeholder: 'Type your answer...',
    };
  }
  if (step === 3) {
    return {
      reply: 'Last one: if you could fix only this, what would change first — people, process, or tools?',
      step: 4,
      quickReplies: ['People', 'Process', 'Tools', 'All of them'],
      placeholder: 'Type your answer...',
    };
  }
  return {
    reply: 'Thanks — this is enough for a useful brief. A human consultant will review it and reach out within 24–48 hours.',
    step: 7,
    quickReplies: [],
    placeholder: '',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const sessionId = String(body?.sessionId || '').trim();
    const step = Number(body?.step || 0);

    if (!message) {
      return new Response(JSON.stringify({ reply: 'Please share a short description of your case.', step, sessionId, quickReplies: [], placeholder: 'Type your answer...' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const response = getStepResponse(step, message);
    return new Response(JSON.stringify({ ...response, sessionId: sessionId || 'session-' + Date.now() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ reply: 'Sorry — Vera is unavailable right now. Please try again.', step: 0, sessionId: '', quickReplies: [], placeholder: '' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, endpoint: '/api/ai-analyst' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
