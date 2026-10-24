import { NextRequest, NextResponse } from 'next/server';
import { requestUser } from '@/lib/request-auth';
import { backendResponse } from '@/lib/backend';
export async function GET(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return backendResponse('/api/chat/' + encodeURIComponent(user.id));
}
export async function POST(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { message } = await request.json();
  if (typeof message !== 'string' || !message.trim() || message.length > 20000) return NextResponse.json({ error: 'A message is required' }, { status: 400 });
  // Never tell a client a message was delivered if the backend rejected it.
  return backendResponse('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, userEmail: user.email, message }) });
}
