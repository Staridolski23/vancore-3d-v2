import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

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

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { user, profile };
}

// GET /api/adminv2/clients
export async function GET(request: NextRequest) {
  try {
    const auth = await adminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: clients, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
