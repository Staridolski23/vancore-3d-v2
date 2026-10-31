import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './supabase';

export const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];
export const isAdminEmail = (email?: string) => ADMIN_EMAILS.includes((email || '').toLowerCase());

export async function requestUser(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ') || !authorization.slice(7).trim()) return null;
  try { return await verifyToken(authorization.slice(7)); } catch { return null; }
}

export async function requireAdmin(request: NextRequest) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  return null;
}
