import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

// Admin emails
const ADMIN_EMAILS = [
  'momchil@vancore.ai',
  'zhanet@vancore.ai',
  'office@vancoresys.com',
];

// Middleware to check admin auth
async function adminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Not authorized', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);
  
  if (!user) {
    return { error: 'Invalid token', status: 401 };
  }

  // Check if user is admin by email (simpler, no DB query needed)
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
  
  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 };
  }

  return { user, profile: { role: 'admin' } };
}

// POST /api/adminv2/login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user?.email_confirmed_at) {
      return NextResponse.json({ error: 'Please verify your email.' }, { status: 403 });
    }

    const isAdmin = ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '');
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    // Update role if missing
    await supabaseAdmin.from('users').upsert({
      id: data.user.id,
      email: data.user.email,
      role: 'admin',
      plan: 'business',
      credits: 99999,
      subscription_status: 'active',
    });

    return NextResponse.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      },
      redirectTo: '/admin-v2',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/adminv2/dashboard
export async function GET(request: NextRequest) {
  try {
    const auth = await adminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get metrics from Supabase
    const { count: totalUsers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    const { count: activeSubs } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
    const { count: verifiedEmails } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client');

    return NextResponse.json({
      totalClients: totalUsers || 0,
      activeSubscriptions: activeSubs || 0,
      verifiedEmails: verifiedEmails || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
