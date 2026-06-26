import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

// GET /api/chat/history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const res = await fetch(`${DO_API}/api/chat/${user.id}`);
    const data = await res.json();
    return NextResponse.json({ messages: data.messages || [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// POST /api/chat/send
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { message } = await request.json();

    await fetch(`${DO_API}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
        message,
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      reply: 'Thank you for your message. Our team will respond shortly.'
    });
  } catch {
    return NextResponse.json({
      success: true,
      reply: 'Thank you for your message. Our team will respond shortly.'
    });
  }
}
