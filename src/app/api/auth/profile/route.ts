import { NextRequest, NextResponse } from 'next/server';
import { requestUser, authFailure } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requestUser(request);
    if (!user) return authFailure(request);
    const profile = user.vancoreProfile;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile.name || '',
        company: profile.company || '',
        phone: profile.phone || '',
        vat_id: profile.vat_id || '',
        plan: profile?.plan || 'starter',
        credits: profile?.credits ?? 5,
        subscription_status: profile?.subscription_status || 'free',
        role: user.vancoreRole,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: 'Your profile is temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
