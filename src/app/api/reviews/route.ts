import { NextRequest, NextResponse } from 'next/server';
import { backendResponse } from '@/lib/backend';
import { requestUser, isAdminUser, authFailure } from '@/lib/request-auth';
export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams;
  const user = await requestUser(request);
  if (!user) return authFailure(request).status === 503 ? authFailure(request) : backendResponse('/api/reviews?status=published');
  if (!isAdminUser(user)) { query.delete('status'); query.set('user_id', user.id); }
  return backendResponse('/api/reviews?' + query.toString());
}
export async function POST(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return authFailure(request);
  const body = await request.json();
  return backendResponse('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, user_id: user.id }) });
}
