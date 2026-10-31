import { backendFetch } from '@/lib/backend';
import { contactInput } from '@/lib/contact-input';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const input = contactInput(await request.json());
    if (!input) return NextResponse.json({ error: 'Enter your name, a valid email and a message (up to 10,000 characters).' }, { status: 400 });

    const res = await backendFetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Your enquiry could not be recorded. Please try again.' }, { status: res.status >= 500 ? 502 : res.status });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Your enquiry could not be recorded. Please try again.' }, { status: 502 });
  }
}
