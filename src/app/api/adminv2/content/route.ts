import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

// GET /api/adminv2/content - proxy to DO
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(DO_API + '/api/content');
    const data = await res.json();
    
    // Transform to array format expected by frontend
    const content = [];
    if (data.sections) {
      for (const [section, values] of Object.entries(data.sections)) {
        for (const [key, value] of Object.entries(values as object)) {
          content.push({ section, key, value, type: typeof value === 'string' && value.length > 100 ? 'textarea' : 'text' });
        }
      }
    }
    
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/adminv2/content - proxy to DO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(DO_API + '/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/adminv2/content - proxy to DO
export async function PUT(request: NextRequest) {
  try {
    const { id, value } = await request.json();
    const res = await fetch(DO_API + '/api/content/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
