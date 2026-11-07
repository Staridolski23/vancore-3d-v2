import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, VerifiedUser } from './supabase';

export const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];
export const isAdminEmail = (email?: string) => ADMIN_EMAILS.includes((email || '').toLowerCase());
// The email list is only a public-signup reservation, never role authority.
export const isAdminUser = (user: Pick<VerifiedUser, 'vancoreRole'> | null) => user?.vancoreRole === 'admin';
const unavailable = new WeakSet<Request>();
export function authFailure(request: NextRequest) {
  return unavailable.has(request)
    ? NextResponse.json({ error: 'Sign-in verification is temporarily unavailable. Please retry.' }, { status: 503 })
    : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function requestUser(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ') || !authorization.slice(7).trim()) return null;
  try { return await verifyToken(authorization.slice(7)); } catch { unavailable.add(request); return null; }
}

export async function requireAdmin(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return authFailure(request);
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  return null;
}
