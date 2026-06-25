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

    const { data: clients, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, company, plan, credits, subscription_status, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
