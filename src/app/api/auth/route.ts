import { requestUser, isAdminEmail } from '@/lib/request-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createAuthClient } from '@/lib/supabase';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { setRefreshCookie, sameOrigin } from '@/lib/session-cookie';

const ADMIN_EMAILS = [
  'momchil@vancore.ai',
  'zhanet@vancore.ai',
  'office@vancoresys.com',
];

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const body = await request.json();
    const { action, email, password, name, company, phone } = body;

    if (action === 'register') {
      if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) return NextResponse.json({ error: 'A valid email and a password of at least 8 characters are required.' }, { status: 400 });
      if (isAdminEmail(email)) return NextResponse.json({ error: 'Administrator accounts must be provisioned by the team.' }, { status: 403 });
      const role = 'client';
      
      // Public signup must use the configured email verification flow, not
      // the administrator API's email_confirm bypass.
      const { data, error } = await createAuthClient().auth.signUp({
        email,
        password,
        options: { data: { name, company, phone, role }, emailRedirectTo: 'https://www.vancoresys.com/login' },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user && data.user.identities?.length) {
        await supabaseAdmin.from('users').upsert({
          id: data.user.id,
          email,
          name: name || '',
          company: company || '',
          role,
          plan: 'starter',
          credits: 5,
          subscription_status: 'free',
          phone: phone || '',
        }, { onConflict: 'id', ignoreDuplicates: true });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Registered successfully.',
        autoConfirmed: !!data.session,
      });
    }

    if (action === 'login') {
      const { data, error } = await createAuthClient().auth.signInWithPassword({
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

      const role = ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '') ? 'admin' : 'client';
      const redirectTo = role === 'admin' ? '/admin-v2' : '/client-portal';

      const response = NextResponse.json({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          company: data.user.user_metadata?.company || '',
          phone: data.user.user_metadata?.phone || '',
          plan: data.user.user_metadata?.plan || 'starter',
          credits: data.user.user_metadata?.credits ?? 5,
          subscription_status: data.user.user_metadata?.subscription_status || 'free',
          role,
        },
        redirectTo,
      });
      setRefreshCookie(response, data.session.refresh_token);
      return response;
    }

    if (action === 'recover-password') {
      const { accessToken, refreshToken, newPassword } = body;
      if (typeof accessToken !== 'string' || accessToken.length > 16000 || typeof refreshToken !== 'string' || refreshToken.length > 8192 || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) return NextResponse.json({ error: 'A valid recovery link and a password of 8–128 characters are required.' }, { status: 400 });
      const client = createAuthClient();
      const { data, error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error || !data.session || !data.user) return NextResponse.json({ error: 'This recovery link is invalid or expired. Request a new one.' }, { status: 401 });
      // Use the authenticated user endpoint so provider recovery/MFA policy applies.
      const { error: updateError } = await client.auth.updateUser({ password: newPassword });
      if (updateError) return NextResponse.json({ error: 'Your password could not be updated. Check the password requirements and retry.' }, { status: 400 });
      await client.auth.signOut({ scope: 'local' });
      return setRefreshCookie(NextResponse.json({ success: true }));
    }

    if (action === 'resend-verification') {
      const { error } = await supabaseAdmin.auth.resend({ type: 'signup', email });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'Verification email sent.' });
    }

    if (action === 'forgot-password') {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.vancoresys.com/login',
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'Password reset email sent.' });
    }

    if (action === 'change-password') {
      const { email, currentPassword, newPassword } = body;
      if (!email || !currentPassword || !newPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const { data: authData, error: authError } = await createAuthClient().auth.signInWithPassword({
        email,
        password: currentPassword,
      } as SignInWithPasswordCredentials);

      if (authError || !authData.user) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        password: newPassword,
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    }

    if (action === 'update-profile') {
      const { name, company, phone, vat_id } = body;
      const user = await requestUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const email = user.email;

      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: user.id,
          email,
          name: name || '',
          company: company || '',
          phone: phone || '',
          vat_id: vat_id || '',
          // Preserve the existing role; profile edits cannot grant privileges.
        });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          name: name || '',
          company: company || '',
          phone: phone || '',
          vat_id: vat_id || '',
        },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
