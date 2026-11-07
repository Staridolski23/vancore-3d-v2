import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, getAccountProfile } from '@/lib/supabase';
import { requireAdmin } from '@/lib/request-auth';
import { listAdminAccounts } from '@/lib/admin-accounts';
import { sameOrigin, setRefreshCookie } from '@/lib/session-cookie';

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.status && error.status < 500 && error.status !== 429 ? 'Sign-in failed. Check your credentials.' : 'Sign-in is temporarily unavailable.' }, { status: error.status && error.status < 500 && error.status !== 429 ? 401 : 503 });
    if (!data.user?.email_confirmed_at || !data.session) return NextResponse.json({ error: 'Please verify your email.' }, { status: 403 });
    const profile = await getAccountProfile(data.user.id);
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    const response = NextResponse.json({ token: data.session.access_token, user: { id: data.user.id, email: data.user.email, name: profile.name || '', role: profile.role }, redirectTo: '/admin-v2' }, { headers: { 'Cache-Control': 'private, no-store' } });
    setRefreshCookie(response, data.session.refresh_token); return response;
  } catch { return NextResponse.json({ error: 'Administrator sign-in is temporarily unavailable.' }, { status: 503 }); }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const clients = await listAdminAccounts();
    return NextResponse.json({ totalClients: clients.length, activeSubscriptions: clients.filter(client => client.plan !== 'starter' && client.subscription_status === 'active').length, verifiedEmails: clients.filter(client => client.email_verified).length }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Dashboard metrics could not be loaded. Please retry.' }, { status: 503 }); }
}
