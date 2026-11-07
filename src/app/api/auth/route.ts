import { requestUser, isAdminEmail, authFailure } from '@/lib/request-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createAuthClient, getAccountProfile, isAuthUnavailable } from '@/lib/supabase';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { setRefreshCookie, sameOrigin } from '@/lib/session-cookie';
import { authEmailRedirect, AUTH_RECOVERY_URL } from '@/lib/auth-redirect';

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
        options: { data: { name, company, phone, role }, emailRedirectTo: authEmailRedirect(request) },
      });

      if (error) {
        if ((error.status || 0) >= 500 || error.status === 429 || error.status === 0) return NextResponse.json({ error: 'Registration is temporarily unavailable. Please retry.' }, { status: 503 });
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user && data.user.identities?.length) {
        const { error: profileError } = await supabaseAdmin.from('users').upsert({
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
        if (profileError) return NextResponse.json({ error: 'Your account was created, but profile setup could not be completed. Please contact the VANCORE team.' }, { status: 503 });
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
        const temporary = !error.status || error.status >= 500 || error.status === 429;
        return NextResponse.json({ error: temporary ? 'Sign-in is temporarily unavailable. Please retry.' : 'Sign-in failed. Check your email and password.' }, { status: temporary ? 503 : 401 });
      }

      if (!data.user?.email_confirmed_at) {
        return NextResponse.json({ 
          error: 'Please verify your email first.', 
          needsVerification: true 
        }, { status: 403 });
      }

      const profile = await getAccountProfile(data.user.id);
      const role = profile.role;
      const redirectTo = role === 'admin' ? '/admin-v2' : '/client-portal';

      const response = NextResponse.json({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile.name || '',
          company: profile.company || '',
          phone: profile.phone || '',
          plan: profile.plan || 'starter',
          credits: profile.credits ?? 0,
          subscription_status: profile.subscription_status || 'free',
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
      const { error } = await createAuthClient().auth.resend({ type: 'signup', email, options: { emailRedirectTo: authEmailRedirect(request) } });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'Verification email sent.' });
    }

    if (action === 'forgot-password') {
      const { error } = await createAuthClient().auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_RECOVERY_URL,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'If an account exists for this email, a password reset link will be sent. Check your inbox and spam folder.' });
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
      const user = await requestUser(request);
      if (!user) return authFailure(request);
      const profileUpdate: Record<string, string> = {};
      for (const [field, limit] of Object.entries({ name: 150, company: 200, phone: 50, vat_id: 50 })) {
        if (!Object.hasOwn(body, field)) continue;
        if (typeof body[field] !== 'string' || body[field].length > limit) return NextResponse.json({ error: 'Check your profile values and try again.' }, { status: 400 });
        profileUpdate[field] = body[field].trim();
      }
      if (!Object.keys(profileUpdate).length) return NextResponse.json({ error: 'No editable profile fields were supplied.' }, { status: 400 });
      const { data: saved, error: profileError } = await supabaseAdmin.from('users').update({ ...profileUpdate, updated_at: new Date().toISOString() }).eq('id', user.id).select('id').single();
      if (profileError || saved?.id !== user.id) return NextResponse.json({ error: 'Your profile could not be saved. Please retry.' }, { status: 503 });
      // The protected profile is canonical. A second metadata write must not
      // turn a successfully saved profile into an apparent failure.
      return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    if (isAuthUnavailable(e)) return NextResponse.json({ error: 'Sign-in verification is temporarily unavailable. Please retry.' }, { status: 503 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
