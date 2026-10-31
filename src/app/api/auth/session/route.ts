import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase';
import { refreshCookie, sameOrigin, setRefreshCookie } from '@/lib/session-cookie';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || request.headers.get('X-Vancore-Session') !== '1') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const token = refreshCookie(request);
  if (!token) return setRefreshCookie(NextResponse.json({ error: 'Please sign in again' }, { status: 401 }));
  try {
    const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: token });
    if (error && (!error.status || error.status >= 500 || error.status === 429)) return NextResponse.json({ error: 'Sign-in service temporarily unavailable' }, { status: 503 });
    if (error || !data.session || !data.user?.email_confirmed_at) return setRefreshCookie(NextResponse.json({ error: 'Please sign in again' }, { status: 401 }));
    return setRefreshCookie(NextResponse.json({ token: data.session.access_token }), data.session.refresh_token);
  } catch {
    // A temporary provider/network error must not revoke a valid cookie.
    return NextResponse.json({ error: 'Sign-in service temporarily unavailable' }, { status: 503 });
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request) || request.headers.get('X-Vancore-Session') !== '1') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const token = refreshCookie(request);
  if (token) {
    try {
      const client = createAuthClient();
      const { data, error } = await client.auth.refreshSession({ refresh_token: token });
      if (error && (!error.status || error.status >= 500 || error.status === 429)) return NextResponse.json({ error: 'Sign-out service temporarily unavailable' }, { status: 503 });
      if (data.session) {
        const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
        if (signOutError) return NextResponse.json({ error: 'Unable to sign out. Please retry.' }, { status: 503 });
      }
    } catch { return NextResponse.json({ error: 'Sign-out service temporarily unavailable' }, { status: 503 }); }
  }
  return setRefreshCookie(NextResponse.json({ success: true }));
}
