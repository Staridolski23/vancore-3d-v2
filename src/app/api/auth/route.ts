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
    const { action, email, password, name, company, phone } = await request.json();

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
        email_confirm: true,
        user_metadata: { name, company, phone, role },
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

      const role = ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '') ? 'admin' : 'client';
      const redirectTo = role === 'admin' ? '/admin-v2' : '/client-portal';

      return NextResponse.json({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          company: data.user.user_metadata?.company || '',
          phone: data.user.user_metadata?.phone || '',
          plan: data.user.user_metadata?.plan || 'starter',
          credits: data.user.user_metadata?.credits || 5,
          subscription_status: data.user.user_metadata?.subscription_status || 'free',
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

    if (action === 'forgot-password') {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.vancoresys.com/login',
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'Password reset email sent.' });
    }

    if (action === 'change-password') {
      const { email, currentPassword, newPassword } = await request.json();
      if (!email || !currentPassword || !newPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
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
      const { email, name, company, phone, vat_id } = await request.json();

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find(u => u.email?.toLowerCase() === email?.toLowerCase());

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: user.id,
          email,
          name: name || '',
          company: company || '',
          phone: phone || '',
          vat_id: vat_id || '',
          role: user.user_metadata?.role || 'client',
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
