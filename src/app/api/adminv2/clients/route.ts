import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const ADMIN_EMAILS = [
  'momchil@vancore.ai',
  'zhanet@vancore.ai',
  'office@vancoresys.com',
];

// GET /api/adminv2/clients
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

    // Use auth.admin.listUsers() to bypass RLS
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Transform to our Client format
    const clients = (usersData?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email || '',
      name: u.user_metadata?.name || '',
      company: u.user_metadata?.company || '',
      plan: u.user_metadata?.plan || 'starter',
      credits: u.user_metadata?.credits || 5,
      subscription_status: u.user_metadata?.subscription_status || 'free',
      role: u.user_metadata?.role || 'client',
      email_verified: u.email_confirmed_at ? 1 : 0,
      created_at: u.created_at,
    }));

    return NextResponse.json({ clients });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
