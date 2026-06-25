import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

// GET /api/adminv2/clients - from Supabase users table
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin by email
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users from Supabase auth
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    
    // Get profiles from users table
    const { data: profiles } = await supabaseAdmin
      .from('users')
      .select('*');

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Transform to Client format
    const clients = (usersData?.users || []).map((u: any) => {
      const profile = profileMap.get(u.id) || {};
      return {
        id: u.id,
        email: u.email || '',
        name: profile.name || u.user_metadata?.name || '',
        company: profile.company || u.user_metadata?.company || '',
        plan: profile.plan || 'starter',
        credits: profile.credits ?? 5,
        subscription_status: profile.subscription_status || 'free',
        role: profile.role || (ADMIN_EMAILS.includes(u.email?.toLowerCase()) ? 'admin' : 'client'),
        email_verified: u.email_confirmed_at ? 1 : 0,
        created_at: u.created_at,
      };
    });

    return NextResponse.json({ clients });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
