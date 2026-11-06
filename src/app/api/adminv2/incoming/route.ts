import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/request-auth';
import { backendFetch } from '@/lib/backend';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const response = await backendFetch('/api/incoming');
    if (!response.ok) return NextResponse.json({ error: 'Enquiries could not be loaded. Please retry.' }, { status: response.status });
    const messages = await response.json();
    if (!Array.isArray(messages)) return NextResponse.json({ error: 'Enquiries could not be loaded. Please retry.' }, { status: 502 });
    return NextResponse.json({ messages }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Enquiries could not be loaded. Please retry.' }, { status: 502 }); }
}
