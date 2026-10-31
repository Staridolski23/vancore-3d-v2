import { NextRequest, NextResponse } from 'next/server';
import { backendResponse } from '@/lib/backend';
import { requestUser, requireAdmin, isAdminEmail } from '@/lib/request-auth';
export async function GET(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = new URL(request.url).searchParams.get('email');
  if (!isAdminEmail(user.email) && (!email || email.toLowerCase() !== user.email?.toLowerCase())) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  return backendResponse('/api/documents' + (email ? '?client_email=' + encodeURIComponent(email) : ''));
}
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  return backendResponse('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await request.json()) });
}
