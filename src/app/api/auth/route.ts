import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, company } = await request.json();

    if (action === 'register') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { name, company },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user) {
        await supabaseAdmin.from('users').insert({
          id: data.user.id,
          email,
          name: name || '',
          company: company || '',
          plan: 'starter',
          credits: 5,
          subscription_status: 'free',
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Registered. Check your email to verify.',
        needsVerification: true,
      });
    }

    if (action === 'login') {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      if (!data.user?.email_confirmed_at) {
        return NextResponse.json({ 
          error: 'Please verify your email first.', 
          needsVerification: true 
        }, { status: 403 });
      }

      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return NextResponse.json({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata?.name || '',
          company: profile?.company || data.user.user_metadata?.company || '',
          plan: profile?.plan || 'starter',
          credits: profile?.credits || 5,
          subscription_status: profile?.subscription_status || 'free',
        },
      });
    }

    if (action === 'resend-verification') {
      const { error } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Verification email sent.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
