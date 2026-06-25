import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';

const ADMIN_EMAILS = [
  'momchil@vancore.ai',
  'zhanet@vancore.ai',
  'office@vancoresys.com',
];

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, company } = await request.json();

    if (action === 'register') {
      const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'client';
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (userExists) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for testing
        user_metadata: { name, company, role },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user) {
        await supabaseAdmin.from('users').upsert({
          id: data.user.id,
          email,
          name: name || '',
          company: company || '',
          role,
          plan: 'starter',
          credits: 5,
          subscription_status: 'free',
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Registered successfully.',
        autoConfirmed: true,
      });
    }

    if (action === 'login') {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      } as SignInWithPasswordCredentials);

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

      const role = profile?.role || (ADMIN_EMAILS.includes(data.user!.email!.toLowerCase()) ? 'admin' : 'client');
      
      if (!profile?.role && role === 'admin') {
        await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', data.user.id);
      }

      const redirectTo = role === 'admin' ? '/admin-v2' : '/client-portal';

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
          role,
        },
        redirectTo,
      });
    }

    if (action === 'resend-verification') {
      const { error } = await supabaseAdmin.auth.resend({ type: 'signup', email });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'Verification email sent.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
