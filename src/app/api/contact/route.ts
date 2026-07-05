import { NextRequest, NextResponse } from 'next/server';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender_name, sender_email, subject, message } = body;

    if (!sender_name || !sender_email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const res = await fetch(`${DO_API}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_name, sender_email, subject, message }),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error: error.error || 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
